# Elastic Beanstalk entry point
# EB looks for 'application' variable in application.py

from app import app

# EB expects the WSGI application to be called 'application'
application = app

if __name__ == "__main__":
    application.run()
