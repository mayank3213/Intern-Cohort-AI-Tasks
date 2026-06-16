from fastapi import FastAPI

app = FastAPI(title="I5 Echo Service", version="1.0.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/echo/{message}")
def echo(message: str) -> dict[str, str]:
    return {"message": message}
