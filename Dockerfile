FROM python:3-slim

WORKDIR /app

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend

COPY ml-model/ ./ml-model

RUN python -m nltk.downloader stopwords

ENV FLASK_APP=backend.app

ENV FLASK_RUN_HOST=0.0.0.0

ENV FLASK_RUN_PORT=5000

EXPOSE 5000

WORKDIR /app/backend

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]