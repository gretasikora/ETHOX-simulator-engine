web: cd backend && gunicorn societyviz.wsgi:application --bind 0.0.0.0:$PORT --workers 4 --timeout 120
release: cd backend && python manage.py migrate --noinput && python manage.py collectstatic --noinput
