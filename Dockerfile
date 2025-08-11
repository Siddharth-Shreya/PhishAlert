FROM python:3-slim

WORKDIR /app

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend

COPY ml-model/ ./ml-model

ENV FLASK_APP=backend.app

ENV FLASK_RUN_HOST=0.0.0.0

ENV FLASK_RUN_PORT=5000

EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "backend.app:app"]