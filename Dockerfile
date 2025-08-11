FROM python:3-slim

WORKDIR /app

COPY requirements.txt ./

RUN pip install -r requirements.txt

COPY app/ ./app

ENV FLASK_APP=app.backend.app

ENV FLASK_RUN_HOST=0.0.0.0

EXPOSE 5000

CMD ["flask", "run"]