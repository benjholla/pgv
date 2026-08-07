import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        print("Navigating to dynamic view...")
        await page.goto("http://localhost:5173", wait_until="networkidle")

        print("Waiting for smart controls...")
        await page.wait_for_selector(".pgv-smart-view-group", state="visible")

        print("Collapsing smart controls...")
        # Get the collapse toggle button by its label
        await page.click('button[aria-label="Collapse Smart Controls"]')

        print("Taking screenshot...")
        await page.screenshot(path="smart_controls_update4.png")
        print("Done!")

        await browser.close()

asyncio.run(run())
