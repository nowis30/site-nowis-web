"""Match local Suno MP3s by their embedded song UUID; never by filename.

Usage: python scripts/prepare-radio-audio.py <download-folder> <inventory.json> [extra-mp3-folder]
Writes only an inventory of the active public catalog. Does not copy other songs.
"""
import concurrent.futures
import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('download_folder')
parser.add_argument('inventory')
parser.add_argument('extra_folders', nargs='*')
parser.add_argument('--receipts', help='Private receipts for authorized older Suno downloads without ID3 identifiers')
args = parser.parse_args()
tracks = json.loads((root / 'src/data/radio-tracks.json').read_text(encoding='utf-8'))
assert tracks and len(tracks) == len({t['id'] for t in tracks})

def inspect(path):
    try:
        result = subprocess.run(['ffprobe', '-v', 'quiet', '-show_entries', 'format_tags=comment', '-of', 'json', str(path)], capture_output=True, timeout=20)
        metadata = json.loads(result.stdout)
        match = re.search(r'\bid=([a-f0-9-]{36})', metadata.get('format', {}).get('tags', {}).get('comment', ''))
        return (match.group(1), str(path)) if match else None
    except (ValueError, subprocess.TimeoutExpired):
        return None

folders = [Path(args.download_folder)] + [Path(folder) for folder in args.extra_folders]
paths = [path for folder in folders for path in folder.glob('*.mp3')]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    sources = dict(item for item in pool.map(inspect, paths) if item)
if args.receipts:
    for receipt in json.loads(Path(args.receipts).read_text(encoding='utf-8')):
        file = Path(receipt['path'])
        identifier = receipt['id']
        assert re.fullmatch(r'[a-f0-9-]{36}', identifier)
        assert receipt['source'].startswith('https://suno-data-uploads.s3.amazonaws.com/studio/uploads/' + identifier)
        assert '?' not in receipt['source'], 'Do not retain temporary access parameters'
        assert hashlib.sha256(file.read_bytes()).hexdigest() == receipt['sha256'], 'Downloaded file changed'
        embedded = inspect(file)
        assert embedded is None or embedded[0] == identifier, 'Embedded song identifier conflicts with receipt'
        sources[identifier] = str(file)
matched = [{**track, 'path': sources[track['id']]} for track in tracks if track['id'] in sources]
hosted = [track for track in tracks if track['src'].startswith('/audio/nowis-radio/')]
missing = [track for track in tracks if track['id'] not in sources and track not in hosted]
Path(args.inventory).write_text(json.dumps({'matched': matched, 'hosted': hosted, 'missing': missing}, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'matched': len(matched), 'hosted': len(hosted), 'missing': [{ 'id': t['id'], 'title': t['title']} for t in missing]}, ensure_ascii=False))
