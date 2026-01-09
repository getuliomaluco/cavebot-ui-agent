import asyncio
import json
import subprocess
import websockets

HOST = "0.0.0.0"
PORT = 8765

async def handle(ws):
    print("🟢 UI connected")

    async for msg in ws:
        try:
            data = json.loads(msg)
            cmd = data.get("cmd")

            if cmd == "key":
                key = data["value"]
                subprocess.run(["xdotool", "key", key])
                print(f"⌨️ key: {key}")

            elif cmd == "click":
                subprocess.run(["xdotool", "click", "1"])
                print("🖱 click")

            elif cmd == "screenshot":
                subprocess.run(["scrot", "screen.png"])
                print("📸 screenshot")

            else:
                print("⚠️ unknown cmd:", data)

            await ws.send(json.dumps({
                "ok": True,
                "cmd": cmd
            }))

        except Exception as e:
            print("❌ error:", e)
            await ws.send(json.dumps({
                "ok": False,
                "error": str(e)
            }))

async def main():
    print(f"🚀 Agent listening on ws://{HOST}:{PORT}")
    async with websockets.serve(handle, HOST, PORT):
        await asyncio.Future()  # run forever

asyncio.run(main())
