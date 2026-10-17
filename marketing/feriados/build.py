"""Renders the creatives for a year into out/<year>/ (git-ignored).
Usage: python3 build.py 2026"""
import sys
from creatives import OUT, render_pair
from occasions import moments

year = int(sys.argv[1])
for m in moments(year):
    render_pair(m, OUT / str(year))
    print(m["date"], m["key"])
