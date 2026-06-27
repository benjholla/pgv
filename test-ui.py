from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:5173")
    page.wait_for_timeout(2000)

    # Click the download format dropdown
    dropdown_btn = page.locator(".pgv-download-dropdown-btn")
    dropdown_btn.click()
    page.wait_for_timeout(1000)

    page.screenshot(path="/home/jules/verification/screenshots/verification1.png")

    # Select PNG format
    page.locator(".pgv-dropdown-option", has_text="PNG").click()
    page.wait_for_timeout(1000)

    # Take another screenshot to see PNG format is set
    page.screenshot(path="/home/jules/verification/screenshots/verification2.png")

    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
