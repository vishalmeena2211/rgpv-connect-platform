"""RGPV portal session establishment.

Encapsulates the ASP.NET handshake: load ProgramSelect, extract the
``__VIEWSTATE`` / ``__EVENTVALIDATION`` tokens, post the B.Tech program
selection, and capture the ``ASP.NET_SessionId`` cookie. The result page then
exposes the captcha image.

This replaces the duplicated ``rgpv_html`` / ``get_captcha_url`` functions that
existed in all three legacy workers.
"""

from __future__ import annotations

from dataclasses import dataclass

import requests
from requests_html import HTML

from app.config import get_settings
from app.core.constants import PROGRAM_BTECH, VIEWSTATE_GENERATOR_PROGRAM
from app.core.exceptions import SessionUnavailable
from app.logging_config import get_logger

logger = get_logger(__name__)


@dataclass
class RGPVSession:
    """A live RGPV portal session ready to submit a result query.

    Bundles the per-request state (the ASP.NET tokens, the session cookie and
    the captcha image URL) that the legacy code passed around as globals.
    """

    session: requests.Session
    viewstate: str
    eventvalidation: str
    cookie: str
    captcha_url: str


def _base_url() -> str:
    return get_settings().rgpv_base_url.rstrip("/")


def _extract_token(html: HTML, selector: str) -> str:
    elements = html.find(selector)
    if not elements:
        raise SessionUnavailable(f"Token {selector} not present on RGPV page")
    return elements[0].attrs["value"]


def _captcha_url(html: HTML) -> str:
    """Locate the captcha <img> in the second gridtable and absolutise its URL."""
    tables = html.find("table.gridtable")
    if len(tables) < 2:
        raise SessionUnavailable("Captcha table not found on RGPV page")
    img = tables[1].find("tr")[0].find("td")[0].find("div")[0].find("img")[0]
    return f"{_base_url()}/{img.attrs['src']}"


def establish_session(*, timeout: int = 20) -> RGPVSession:
    """Perform the full ASP.NET handshake and return a ready session.

    :raises SessionUnavailable: if any step of the handshake fails.
    """
    base = _base_url()
    session = requests.Session()

    try:
        landing = session.get(f"{base}/ProgramSelect.aspx", timeout=timeout)
        landing.raise_for_status()
        landing_html = HTML(html=landing.text)

        payload = {
            "__EVENTTARGET": "radlstProgram$1",
            "__EVENTARGUMENT": "",
            "__LASTFOCUS": "",
            "__VIEWSTATE": _extract_token(landing_html, "#__VIEWSTATE"),
            "__VIEWSTATEGENERATOR": VIEWSTATE_GENERATOR_PROGRAM,
            "__EVENTVALIDATION": _extract_token(landing_html, "#__EVENTVALIDATION"),
            "radlstProgram": PROGRAM_BTECH,
        }
        selected = session.post(f"{base}/ProgramSelect.aspx", data=payload, timeout=timeout)
        selected.raise_for_status()
    except requests.RequestException as exc:
        raise SessionUnavailable(f"RGPV handshake failed: {exc}") from exc

    if not selected.history:
        raise SessionUnavailable("Expected a redirect carrying the session cookie")

    cookie = selected.history[0].headers["Set-Cookie"].replace("; path=/; HttpOnly", "")
    session.cookies.set("ASP.NET_SessionId", cookie.split("=")[1], domain="result.rgpv.ac.in")

    result_html = HTML(html=selected.text)
    return RGPVSession(
        session=session,
        viewstate=_extract_token(result_html, "#__VIEWSTATE"),
        eventvalidation=_extract_token(result_html, "#__EVENTVALIDATION"),
        cookie=cookie,
        captcha_url=_captcha_url(result_html),
    )
