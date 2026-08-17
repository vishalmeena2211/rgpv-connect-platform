"""RGPV Result Worker — unified FastAPI service.

Merges the three legacy workers (session supplier, bulk fetcher, single fetcher)
into one service with a shared scraping core.
"""

__version__ = "0.1.0"
