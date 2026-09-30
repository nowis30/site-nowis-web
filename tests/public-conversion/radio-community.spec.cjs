const { test, expect } = require('@playwright/test');
const { PrismaClient } = require('@prisma/client');
const fs = require('node:fs');
const tracks = require('../../src/data/radio-tracks.json');
const store = require('../../src/data/music-store.json');
const baseURL = 'http://127.0.0.1:3000';
const dbUrl = new URL(process.env.DATABASE_URL || 'http://invalid');
if (!['localhost', '127.0.0.1'].includes(dbUrl.hostname) || dbUrl.pathname !== '/nowis_public_qa') {
  throw new Error('Radio integration tests require the isolated nowis_public_qa database.');
}
const prisma = new PrismaClient();
const password = 'RadioTest2026';
const uniqueEmail = () => `radio-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
test.beforeEach(async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('nowis_cookie_consent_v2', JSON.stringify({version:2,analytics:false,advertising:false,decidedAt:Date.now()})));
});
test.afterAll(async () => { await prisma.$disconnect(); });
async function register(api, email = uniqueEmail(), name = 'Auditeur QA') {
  const response = await api.post('/api/radio/account', {data:{email,fullName:name,password,website:''},headers:{origin:baseURL,'x-forwarded-for':`qa-${email}`}});
  expect(response.status(), await response.text()).toBe(201);
  return email;
}
async function favorite(api,id,method='put') {
  const response = await api[method]('/api/radio/favorites',{data:{trackId:id},headers:{origin:baseURL}});
  expect(response.status(),await response.text()).toBe(200);
}
async function audioFixture(page) {
  const body=fs.readFileSync('public/music/background.mp3');
  await page.route(/\/audio\/nowis-radio(?:-suno)?\/.*\.mp3(?:\?|$)/,route=>route.fulfill({status:200,contentType:'audio/mpeg',body}));
}

test('radio account: signup, private favorites across sessions, safe CRM separation and disabled users',async({playwright,page})=>{
  const email=uniqueEmail();
  const existing=await prisma.contact.create({data:{type:'CLIENT',fullName:'Existing private client',email,tags:[]}});
  const tasks=await prisma.task.count();
  await page.goto('/radio/compte');
  await page.getByLabel('Prénom ou pseudo',{exact:true}).fill('Camille QA');
  await page.getByLabel('Courriel',{exact:true}).fill(email);
  await page.getByLabel('Mot de passe',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Créer mon compte gratuit',exact:true}).click();
  await expect(page).toHaveURL(/\/radio#mes-favoris$/);
  await expect(page.locator('#mes-favoris')).toContainText('Bonjour Camille QA');
  const user=await prisma.user.findUnique({where:{email},include:{contact:true}});
  expect(user.role).toBe('PORTAL_USER');expect(user.contactId).not.toBe(existing.id);expect(user.contact.type).toBe('PARTICIPANT');
  expect(await prisma.task.count()).toBe(tasks);
  const cookie=(await page.context().cookies()).find(c=>c.name==='nowis_client_session');
  expect(cookie.httpOnly).toBeTruthy();expect(cookie.sameSite).toBe('Lax');
  await page.locator('.nr-catalogue summary').click();
  const row=page.locator(`.nr-catalogue [data-track-id="${tracks[0].id}"]`);
  await row.getByRole('button',{name:`Ajouter ${tracks[0].title} aux favoris`,exact:true}).click();
  await expect(page.getByRole('list',{name:'Mes chansons favorites'}).locator('li')).toHaveCount(1);
  const same=await playwright.request.newContext({baseURL});
  const second=await playwright.request.newContext({baseURL});
  const anonymous=await playwright.request.newContext({baseURL});
  try {
    expect((await same.post('/api/client-auth/login',{data:{email,password,next:'/radio'}})).status()).toBe(200);
    expect((await (await same.get('/api/radio/favorites')).json()).trackIds).toEqual([tracks[0].id]);
    await register(second);
    expect((await (await second.get('/api/radio/favorites')).json()).trackIds).toEqual([]);
    await favorite(second,tracks[1].id);
    expect((await (await same.get('/api/radio/favorites')).json()).trackIds).toEqual([tracks[0].id]);
    expect((await second.put('/api/radio/favorites',{data:{trackId:tracks[0].id,userId:user.id}})).status()).toBe(400);
    expect((await anonymous.put('/api/radio/favorites',{data:{trackId:tracks[0].id}})).status()).toBe(401);
    expect((await same.put('/api/radio/favorites',{data:{trackId:'invalid'}})).status()).toBe(400);
    expect((await same.put('/api/radio/favorites',{data:{trackId:tracks[1].id},headers:{origin:'https://evil.example'}})).status()).toBe(403);
    await favorite(same,tracks[0].id); // Idempotent; no duplicates.
    expect(await prisma.radioFavorite.count({where:{userId:user.id}})).toBe(1);
    await page.getByRole('button',{name:'Me déconnecter',exact:true}).click();
    await expect(page.getByRole('list',{name:'Mes chansons favorites'})).toHaveCount(0);
    expect((await (await page.request.get('/api/radio/favorites')).json()).user).toBeNull();
    await prisma.user.update({where:{id:user.id},data:{isActive:false}});
    expect((await same.put('/api/radio/favorites',{data:{trackId:tracks[1].id}})).status()).toBe(401);
  } finally {await same.dispose();await second.dispose();await anonymous.dispose();}
});

test('radio comments: immediate publication, exactly five recent, older pagination, replay and moderation',async({page})=>{
  await prisma.publicComment.deleteMany({where:{sourcePage:'/radio'}});
  await prisma.apiRateLimit.deleteMany({where:{scope:'radio:comment'}});
  const ids=[];
  for(let i=0;i<7;i++) {
    const response=await page.request.post('/api/radio/comments',{data:{displayName:`Auditeur ${i}`,message:`Souvenir musical numéro ${i}`,radioTrackId:tracks[i].id},headers:{origin:baseURL,'x-forwarded-for':`192.0.2.${i+1}`}});
    expect(response.status(),await response.text()).toBe(201);ids.push((await response.json()).comment.id);
  }
  expect(await prisma.publicComment.count({where:{id:{in:ids},status:'APPROVED'}})).toBe(7);
  const first=await (await page.request.get('/api/radio/comments')).json();
  expect(first.comments).toHaveLength(5);expect(first.comments[0].displayName).toBe('Auditeur 6');
  expect(Object.keys(first.comments[0]).sort()).toEqual(['createdAt','displayName','id','message','radioTrackId']);
  const older=await (await page.request.get(`/api/radio/comments?cursor=${first.nextCursor}`)).json();
  expect(older.comments).toHaveLength(2);expect(older.nextCursor).toBeNull();
  expect(new Set([...first.comments,...older.comments].map(c=>c.id)).size).toBe(7);
  expect((await page.request.get('/api/radio/comments?cursor=bad')).status()).toBe(400);
  const testimonials=await (await page.request.get('/api/public/comments')).json();
  expect(testimonials.comments.some(c=>ids.includes(c.id))).toBe(false);
  await audioFixture(page);await page.goto('/radio');
  const latest=page.getByRole('list',{name:'Derniers commentaires'});
  await expect(latest.locator(':scope > li')).toHaveCount(5);
  await page.locator('.nr-older summary').click();
  await expect(page.locator('.nr-older .nr-comment')).toHaveCount(2);
  await page.getByRole('button',{name:`Réécouter ${tracks[6].title}`,exact:true}).click();
  const audio=page.getByTestId('nowis-radio-audio');
  await expect(audio).toHaveAttribute('src',tracks[6].src);
  await expect.poll(()=>audio.evaluate(a=>!a.paused&&a.currentTime>0)).toBeTruthy();
  await page.getByLabel('Prénom ou pseudo',{exact:true}).fill('Nouvel auditeur');
  await page.locator('#comment-track').selectOption(tracks[0].id);
  const text='<img src=x onerror=alert(1)> Un refrain à réécouter.';
  await page.getByLabel('Votre commentaire',{exact:true}).fill(text);
  await page.getByRole('button',{name:'Publier mon commentaire',exact:true}).click();
  await expect(latest.locator('li').first()).toContainText(text);
  await expect(latest.locator('img')).toHaveCount(0);
  await expect(latest.locator(':scope > li')).toHaveCount(5);
  const posted=await prisma.publicComment.findFirst({where:{displayName:'Nouvel auditeur'}});
  await prisma.publicComment.update({where:{id:posted.id},data:{status:'ARCHIVED'}});
  await page.reload();await expect(latest).not.toContainText('Nouvel auditeur');
  const payload={displayName:'QA Rate',message:'Un autre souvenir',radioTrackId:null};
  for(let i=0;i<5;i++)expect((await page.request.post('/api/radio/comments',{data:payload,headers:{'x-forwarded-for':'192.0.2.200'}})).status()).toBe(201);
  expect((await page.request.post('/api/radio/comments',{data:payload,headers:{'x-forwarded-for':'192.0.2.200'}})).status()).toBe(429);
  expect((await page.request.post('/api/radio/comments',{data:{...payload,status:'APPROVED'}})).status()).toBe(400);
  expect((await page.request.post('/api/radio/comments',{data:{...payload,radioTrackId:'bad'}})).status()).toBe(400);
  expect((await page.request.post('/api/radio/comments',{data:{...payload,website:'bot'}})).status()).toBe(400);
  expect((await page.request.post('/api/radio/comments',{data:payload,headers:{origin:'https://evil.example'}})).status()).toBe(403);
});

test('radio favorites: selected songs loop, reload preserves selection, single-song list and full-radio return',async({page})=>{
  await register(page.request);await favorite(page.request,tracks[0].id);await favorite(page.request,tracks[1].id);
  // A real short MP3 verifies natural ended events; seeking in a mocked HTTP
  // response without Range support is not a reliable way to reach EOF in Chrome.
  await page.addInitScript(()=>{
    window.__selectionEnded=[];
    document.addEventListener('ended',event=>{
      if(event.target instanceof HTMLAudioElement && event.target.dataset.testid==='nowis-radio-audio') window.__selectionEnded.push(event.target.getAttribute('src'));
    },true);
  });
  const audioPattern=/\/audio\/nowis-radio(?:-suno)?\/.*\.mp3(?:\?|$)/;
  const short=fs.readFileSync('tests/fixtures/radio-short.mp3');
  await page.route(audioPattern,route=>route.fulfill({status:200,contentType:'audio/mpeg',body:short}));
  await page.goto('/radio');
  const audio=page.getByTestId('nowis-radio-audio');
  await page.getByRole('button',{name:'Écouter ma sélection',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.__selectionEnded.length)).toBeGreaterThanOrEqual(6);
  await page.locator('.nr-dock').getByRole('button',{name:'Arrêter et fermer la radio'}).click();
  expect((await page.evaluate(()=>window.__selectionEnded)).slice(0,6)).toEqual([tracks[0].src,tracks[1].src,tracks[0].src,tracks[1].src,tracks[0].src,tracks[1].src]);
  await page.unroute(audioPattern);await audioFixture(page);
  await page.getByRole('button',{name:'Écouter ma sélection',exact:true}).click();
  await expect(audio).toHaveAttribute('src',tracks[0].src);
  await expect.poll(()=>audio.evaluate(a=>!a.paused&&a.currentTime>0)).toBeTruthy();
  await page.locator('.nr-player').getByRole('button',{name:'Chanson suivante'}).click();
  await expect(audio).toHaveAttribute('src',tracks[1].src);
  await expect.poll(()=>audio.evaluate(a=>!a.paused&&a.currentTime>0)).toBeTruthy();
  await page.locator('.nr-player').getByRole('button',{name:'Mettre la radio en pause'}).click();
  await expect(page.getByTestId('radio-cycle-progress')).toContainText('Titre 2 sur 2');
  await page.reload();await expect(audio).not.toHaveAttribute('src',/.+/);
  await page.locator('.nr-player').getByRole('button',{name:'Écouter la radio',exact:true}).click();
  await expect(audio).toHaveAttribute('src',tracks[1].src);
  await page.locator('.nr-player').getByRole('button',{name:'Chanson suivante'}).click();
  await expect(audio).toHaveAttribute('src',tracks[0].src);
  await page.getByRole('button',{name:'Revenir aux 139 chansons de la radio'}).click();
  await expect(page.getByTestId('radio-cycle-progress')).toContainText('Titre 1 sur 139');
  const favoriteList=page.getByRole('list',{name:'Mes chansons favorites'});
  await favoriteList.getByRole('button',{name:`Retirer ${tracks[1].title} des favoris`,exact:true}).click();
  await expect(favoriteList.locator('li')).toHaveCount(1);
  await page.getByRole('button',{name:'Écouter ma sélection',exact:true}).click();
  await expect(audio).toHaveAttribute('src',tracks[0].src);
  await page.locator('.nr-player').getByRole('button',{name:'Chanson suivante'}).click();
  await expect(page.getByTestId('radio-cycle-progress')).toContainText('Titre 1 sur 1');
  await page.getByRole('button',{name:'Me déconnecter',exact:true}).click();
  await expect(audio).not.toHaveAttribute('src',/.+/);
  expect(await page.evaluate(()=>sessionStorage.getItem('nowis-radio-session-v1'))).toBeNull();
});

test('new album and community: official links, presentation placement, responsive forms and sharing',async({page,context},testInfo)=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/');
  const album=page.locator('#nouvel-album');
  await expect(album.getByRole('heading')).toHaveText('L’amourde Nowis.');
  expect(await page.locator('#about-nowis').evaluate(el=>Boolean(el.compareDocumentPosition(document.querySelector('#nouvel-album'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  await expect(album.getByRole('link',{name:'Acheter l’album sur iTunes ↗'})).toHaveAttribute('href',/6817287623.*app=itunes/);
  await album.scrollIntoViewIfNeeded();
  await expect.poll(()=>album.locator('img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBeTruthy();
  await page.goto('/radio');
  await page.locator('.nr-album-tracks summary').click();
  await expect(page.locator('.nr-album-tracks li')).toHaveCount(32);
  for(const track of store.album.tracks) await expect(page.getByRole('link',{name:`Acheter ${track.title} sur iTunes`,exact:true}).first()).toHaveAttribute('href',new RegExp(`i=${track.id}.*app=itunes`));
  await page.locator('.nr-catalogue summary').click();
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('#commentaires').screenshot({path:testInfo.outputPath('radio-comments-mobile.png')});
  await page.locator('#nouvel-album').screenshot({path:testInfo.outputPath('album-mobile.png')});
  await page.locator('.nr-player').getByRole('button',{name:/Partager/}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.goto('/radio/compte');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
  await page.getByRole('button',{name:'Me connecter',exact:true}).click();
  await expect(page.getByRole('link',{name:'Mot de passe oublié ?'})).toBeVisible();
});
