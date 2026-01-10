import gzip
import json
from glob import glob

names = set()
for filename in glob("mabi_auctuion_dump_data-main/data/2026/01/*"):
    f = gzip.open(filename)
    fr = f.read()

    data = json.loads(fr)
    for xx in data:
        names.add(xx["item_name"])

with open("items.json", "w") as f:
    f.write(json.dumps(sorted(names), indent=True, ensure_ascii=False))
