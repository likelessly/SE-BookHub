# เพิ่มบรรทัดเหล่านี้ไว้ตอนต้นไฟล์ manage.py ก่อน import อื่นๆ
try:
    import distutils
except ModuleNotFoundError:
    import setuptools._distutils as distutils
    import sys
    sys.modules["distutils"] = distutils

#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
