web: cd backend && python manage.py migrate --run-syncdb && python manage.py collectstatic --noinput && gunicorn societyviz.wsgi:application --bind 0.0.0.0:$PORT --workers 4 --timeout 120
