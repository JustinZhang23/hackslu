import httpx
import asyncio

async def main():
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.options("http://localhost:8000/crossword", headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
            })
            print("Status:", resp.status_code)
            print("Headers:", resp.headers)
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(main())
