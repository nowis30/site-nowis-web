"""Match local Suno MP3s by their embedded song UUID; never by filename.

Usage: python scripts/prepare-radio-audio.py <download-folder> <inventory.json>
Writes only an inventory of the 141 public tracks. Does not copy other songs.
"""
import concurrent.futures
import json
import re
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
tracks = json.loads((root / 'src/data/radio-tracks.json').read_text(encoding='utf-8'))
assert len(tracks) == len({t['id'] for t in tracks}) == 141

def inspect(path):
    try:
        result = subprocess.run(['ffprobe', '-v', 'quiet', '-show_entries', 'format_tags=comment', '-of', 'json', str(path)], capture_output=True, timeout=20)
        metadata = json.loads(result.stdout)
        match = re.search(r'\bid=([a-f0-9-]{36})', metadata.get('format', {}).get('tags', {}).get('comment', ''))
        return (match.group(1), str(path)) if match else None
    except (ValueError, subprocess.TimeoutExpired):
        return None

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    sources = dict(item for item in pool.map(inspect, Path(sys.argv[1]).glob('*.mp3')) if item)
matched = [{**track, 'path': sources[track['id']]} for track in tracks if track['id'] in sources]
missing = [track for track in tracks if track['id'] not in sources]
Path(sys.argv[2]).write_text(json.dumps({'matched': matched, 'missing': missing}, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'matched': len(matched), 'missing': [{ 'id': t['id'], 'title': t['title']} for t in missing]}, ensure_ascii=False))
