from TikTokLive import TikTokLiveClient
from TikTokLive.client.logger import LogLevel
from TikTokLive.events import ConnectEvent, CommentEvent, GiftEvent
import asyncio
import websockets
import json

client = TikTokLiveClient(unique_id="@santichkaa")

connected_clients = set()


async def websocket_handler(websocket):
    connected_clients.add(websocket)
    try:
        # Keep the connection open
        async for _ in websocket:
            # You can handle incoming messages from the browser if needed
            pass
    finally:
        connected_clients.remove(websocket)


async def broadcast(message):
    if connected_clients:
        await asyncio.gather(*[client.send(message) for client in connected_clients])


@client.on(ConnectEvent)
async def on_connect(event: ConnectEvent):
    client.logger.info(f"Connected to @{event.unique_id}!")


@client.on(CommentEvent)
async def on_comment(event: CommentEvent) -> None:
    # client.logger.info(f"{event.user.nickname} -> {event.comment}")
    # print(event.user.avatar_thumb.m_urls[0])
    pass


@client.on(GiftEvent)
async def on_gift(event: GiftEvent):
    # Can have a streak and streak is over
    if event.gift.streakable and not event.streaking:
        print(
            f'{event.user.unique_id} sent {event.repeat_count}x "{event.gift.name}" ({event.gift.diamond_count * event.repeat_count} diamonds)'
        )
        await broadcast(
            json.dumps(
                {
                    "nickname": event.user.nickname,
                    "avatar": (
                        event.user.avatar_thumb.m_urls[0]
                        if event.user.avatar_thumb.m_urls
                        else None
                    ),
                    "diamond_count": event.gift.diamond_count * event.repeat_count,
                    "gift_name": event.gift.name,
                    "gift_image": event.gift.image.m_urls[0],
                    "gift_amount": event.repeat_count,
                }
            )
        )

    # Cannot have a streak
    elif not event.gift.streakable:
        print(
            f'{event.user.unique_id} sent "{event.gift.name}" ({event.gift.diamond_count} diamonds)'
        )
        await broadcast(
            json.dumps(
                {
                    "nickname": event.user.nickname,
                    "avatar": (
                        event.user.avatar_thumb.m_urls[0]
                        if event.user.avatar_thumb.m_urls
                        else None
                    ),
                    "diamond_count": event.gift.diamond_count,
                    "gift_name": event.gift.name,
                    "gift_image": event.gift.image.m_urls[0],
                    "gift_amount": 1,
                }
            )
        )


client.add_listener(CommentEvent, on_comment)


async def main():
    await websockets.serve(websocket_handler, "localhost", 8765)

    client.logger.setLevel(LogLevel.INFO.value)

    await client.connect()
    await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
