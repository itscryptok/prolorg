#!/usr/bin/env python3
"""Prolorg Phase 2 seed: 8 sample experts, one per specialty.
Runs with psycopg (no Prisma engine needed).

Usage: DATABASE_URL='postgresql://...' python3 prisma/seed.py
Samples are flagged isSample=true and removable once real experts join.
"""
import os
import sys
import uuid

import psycopg

DB = os.environ.get("DATABASE_URL")
if not DB:
    sys.exit("DATABASE_URL is not set")

EXPERTS = [
    {
        "slug": "marcus-reid", "name": "Marcus Reid",
        "headline": "Forensic data analyst — I turn messy digital evidence into clear answers",
        "bio": "I spent 9 years doing digital forensics for insurance investigators before bringing AI into the workflow. I recover deleted files, reconstruct timelines from device data, and write reports that hold up when it matters.\n\nI use AI-assisted triage to cut through terabytes fast, then verify everything by hand. You get speed without sacrificing accuracy.",
        "specialty": "Forensic analysis",
        "skills": ["Digital forensics", "Timeline reconstruction", "Python", "Data recovery", "Report writing"],
        "hourlyRate": 180, "projectRate": 1500, "availability": "Within 1 week",
        "city": "Atlanta", "country": "United States", "languages": ["English"],
        "yearsExperience": 9, "ratingAvg": 4.9, "reviewCount": 23, "completedJobs": 31,
    },
    {
        "slug": "elena-vasquez", "name": "Elena Vasquez",
        "headline": "Genealogy researcher — trace your family lines with AI-guided records search",
        "bio": "I help families find their people. Using AI to search census records, immigration manifests, newspapers, and DNA-adjacent clues, I piece together family lines that stalled for decades.\n\nEvery trace ends with a sourced family report and a visual tree you can share at reunions.",
        "specialty": "Genealogy trace",
        "skills": ["Archival research", "Census records", "Family trees", "Immigration manifests"],
        "hourlyRate": 95, "projectRate": 600, "availability": "Available now",
        "city": "San Antonio", "country": "United States", "languages": ["English", "Spanish"],
        "yearsExperience": 7, "ratingAvg": 5.0, "reviewCount": 41, "completedJobs": 58,
    },
    {
        "slug": "dr-priya-nair", "name": "Dr. Priya Nair",
        "headline": "Computational biologist — accelerate lab discovery with AI workflows",
        "bio": "PhD in computational biology. I build AI pipelines that chew through assay data, screen compound libraries, and surface the candidates worth your wet-lab time.\n\nI've supported three published studies and I speak fluent bench-scientist: no black boxes, every prediction comes with its reasoning.",
        "specialty": "Lab discovery",
        "skills": ["Computational biology", "Assay analysis", "ML pipelines", "Python", "R"],
        "hourlyRate": 250, "projectRate": 4000, "availability": "Within 2 weeks",
        "city": "Boston", "country": "United States", "languages": ["English", "Hindi"],
        "yearsExperience": 11, "ratingAvg": 4.8, "reviewCount": 12, "completedJobs": 15,
    },
    {
        "slug": "jordan-blake", "name": "Jordan Blake",
        "headline": "AI strategy consultant — turn AI into your market advantage",
        "bio": "I help small and mid-size businesses find the one AI move that actually moves revenue — then implement it. No 80-slide decks; we pick a use case, ship it, and measure it.\n\nBackground: 8 years in operations consulting, last 4 focused entirely on applied AI for retail and services businesses.",
        "specialty": "Market advantage",
        "skills": ["AI strategy", "Process automation", "ROI analysis", "Change management"],
        "hourlyRate": 220, "projectRate": 3000, "availability": "Within 1 week",
        "city": "Chicago", "country": "United States", "languages": ["English"],
        "yearsExperience": 8, "ratingAvg": 4.9, "reviewCount": 18, "completedJobs": 22,
    },
    {
        "slug": "sofia-lindqvist", "name": "Sofia Lindqvist",
        "headline": "1-on-1 AI tutor — master ChatGPT, Claude & everyday automation",
        "bio": "I teach busy professionals to actually use AI instead of just hearing about it. Sessions are hands-on: we work on YOUR documents, YOUR inbox, YOUR workflows.\n\nMost students save 5+ hours a week after four sessions. Patient, jargon-free, and I never make you feel behind.",
        "specialty": "Personal AI tutor",
        "skills": ["Prompt engineering", "ChatGPT", "Claude", "Workflow automation", "Teaching"],
        "hourlyRate": 75, "projectRate": 280, "availability": "Available now",
        "city": "Austin", "country": "United States", "languages": ["English", "Swedish"],
        "yearsExperience": 5, "ratingAvg": 5.0, "reviewCount": 67, "completedJobs": 120,
    },
    {
        "slug": "david-okafor", "name": "David Okafor",
        "headline": "Full-stack AI developer — I ship your technical AI project end to end",
        "bio": "I design and build production AI systems: RAG assistants, document pipelines, voice agents, and internal tools. You bring the problem; I deliver working software with docs and handover training.\n\n12 years building software, 4 shipping LLM products. I quote fixed project prices so there are no surprises.",
        "specialty": "Technical project developer",
        "skills": ["TypeScript", "Python", "RAG systems", "LangChain", "API design", "PostgreSQL"],
        "hourlyRate": 160, "projectRate": 2500, "availability": "Within 2 weeks",
        "city": "Dallas", "country": "United States", "languages": ["English"],
        "yearsExperience": 12, "ratingAvg": 4.9, "reviewCount": 29, "completedJobs": 34,
    },
    {
        "slug": "amara-diallo", "name": "Amara Diallo",
        "headline": "Data collector & analyst — clean datasets, honest dashboards",
        "bio": "I collect data properly and analyze it honestly. Web scraping, survey design, spreadsheet rescues, SQL pipelines, and dashboards that tell you what's actually happening.\n\nI flag dirty data instead of hiding it, and every deliverable includes the cleaned dataset — yours to keep.",
        "specialty": "Data collector & analyst",
        "skills": ["Web scraping", "SQL", "Data cleaning", "Dashboards", "Excel", "Python"],
        "hourlyRate": 85, "projectRate": 700, "availability": "Available now",
        "city": "Houston", "country": "United States", "languages": ["English", "French"],
        "yearsExperience": 6, "ratingAvg": 0.0, "reviewCount": 0, "completedJobs": 0,
    },
    {
        "slug": "kenji-tanaka", "name": "Kenji Tanaka",
        "headline": "AI generalist — if it's AI work, ask me what's possible",
        "bio": "Not sure which specialty fits? Start here. I scope fuzzy AI ideas into concrete plans: what's feasible, what it costs, and who should build it.\n\nI do the quick wins myself — automations, content pipelines, research agents — and give you straight advice on the rest.",
        "specialty": "Other AI work",
        "skills": ["AI scoping", "Automation", "Research agents", "Content pipelines"],
        "hourlyRate": 110, "projectRate": None, "availability": "Within 1 month",
        "city": "Seattle", "country": "United States", "languages": ["English", "Japanese"],
        "yearsExperience": 7, "ratingAvg": 0.0, "reviewCount": 0, "completedJobs": 0,
    },
]

SQL = """
INSERT INTO "ExpertProfile"
  ("id","slug","name","headline","bio","specialty","skills","hourlyRate","projectRate",
   "availability","city","country","languages","yearsExperience","ratingAvg",
   "reviewCount","completedJobs","status","isSample","createdAt","updatedAt")
VALUES
  (%(id)s,%(slug)s,%(name)s,%(headline)s,%(bio)s,%(specialty)s,%(skills)s,%(hourlyRate)s,
   %(projectRate)s,%(availability)s,%(city)s,%(country)s,%(languages)s,%(yearsExperience)s,
   %(ratingAvg)s,%(reviewCount)s,%(completedJobs)s,'APPROVED',true,now(),now())
ON CONFLICT ("slug") DO UPDATE SET
  "name"=excluded."name","headline"=excluded."headline","bio"=excluded."bio",
  "specialty"=excluded."specialty","skills"=excluded."skills",
  "hourlyRate"=excluded."hourlyRate","projectRate"=excluded."projectRate",
  "availability"=excluded."availability","city"=excluded."city","country"=excluded."country",
  "languages"=excluded."languages","yearsExperience"=excluded."yearsExperience",
  "ratingAvg"=excluded."ratingAvg","reviewCount"=excluded."reviewCount",
  "completedJobs"=excluded."completedJobs","status"='APPROVED',"isSample"=true,
  "updatedAt"=now();
"""

with psycopg.connect(DB) as conn:
    with conn.cursor() as cur:
        for e in EXPERTS:
            cur.execute(SQL, {"id": str(uuid.uuid4()), **e})
            print("seeded", e["slug"])
    conn.commit()

print("done")
