"""Submit the result form and return the raw result HTML.

Replays the ``BErslt.aspx`` POST with the session's viewstate/eventvalidation
tokens, the enrollment, semester and solved captcha.
"""

from __future__ import annotations

import requests
from requests_html import HTML

from app.config import get_settings
from app.core.constants import VIEWSTATE_GENERATOR_RESULT
from app.core.exceptions import SessionUnavailable
from app.core.session import RGPVSession


def fetch_result_html(
    rgpv: RGPVSession,
    enrollment: str,
    semester: int,
    captcha: str,
    *,
    timeout: int = 20,
) -> HTML:
    """POST the result form and return the parsed response HTML."""
    base = get_settings().rgpv_base_url.rstrip("/")
    payload = {
        "__EVENTTARGET": "",
        "__EVENTARGUMENT": "",
        "__VIEWSTATE": rgpv.viewstate,
        "__VIEWSTATEGENERATOR": VIEWSTATE_GENERATOR_RESULT,
        "__EVENTVALIDATION": rgpv.eventvalidation,
        "ctl00$ContentPlaceHolder1$txtrollno": enrollment,
        "ctl00$ContentPlaceHolder1$drpSemester": str(semester),
        "ctl00$ContentPlaceHolder1$rbtnlstSType": "G",
        "ctl00$ContentPlaceHolder1$TextBox1": captcha,
        "ctl00$ContentPlaceHolder1$btnviewresult": "View Result",
    }
    try:
        response = rgpv.session.post(
            f"{base}/BErslt.aspx",
            headers={"Cookie": rgpv.cookie},
            data=payload,
            timeout=timeout,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise SessionUnavailable(f"Result submission failed: {exc}") from exc

    return HTML(html=response.text)
