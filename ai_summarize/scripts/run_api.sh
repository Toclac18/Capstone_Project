#!/usr/bin/env bash
uvicorn server.api_main:app --host 0.0.0.0 --port 8000
