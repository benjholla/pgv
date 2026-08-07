import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        print("Navigating to dynamic view...")
        await page.goto("http://localhost:5173", wait_until="networkidle")

        print("Waiting for smart controls...")
        # wait a bit
        await page.wait_for_timeout(2000)

        print("Taking screenshot...")
        await page.screenshot(path="smart_controls_update6.png")
        print("Done!")

        await browser.close()

asyncio.run(run())
