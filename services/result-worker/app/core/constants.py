"""Constants describing the RGPV result portal's quirks.

The RGPV portal is a legacy ASP.NET WebForms app. Fetching a result means
replaying its ``__VIEWSTATE`` / ``__EVENTVALIDATION`` tokens and posting form
fields with the exact ``ctl00$ContentPlaceHolder1$*`` names it expects. These
constants capture those magic values in one place.
"""

from __future__ import annotations

# Program radio-button value for B.Tech on the ProgramSelect page.
PROGRAM_BTECH = "24"

# ASP.NET viewstate generators (page-specific, observed constants).
VIEWSTATE_GENERATOR_PROGRAM = "F697B5F5"
VIEWSTATE_GENERATOR_RESULT = "56D9EF13"

# Captcha text is always exactly 5 characters on the RGPV portal.
CAPTCHA_LENGTH = 5

# Error strings the portal renders inside an alert() in div.rslmain.
ERR_NOT_FOUND = "Result for this Enrollment No. not Found"
ERR_WRONG_CAPTCHA = "you have entered a wrong text"


def subject_table_count(semester: int) -> int:
    """Number of subject rows to read from the grading panel for a semester.

    The RGPV grading panel renders a different number of subject tables per
    semester band. These bands were reverse-engineered from the live portal;
    the legacy workers hardcoded the same 8/11/12 values inline.
    """
    if semester >= 7:
        return 8
    if semester >= 5:
        return 11
    return 12
