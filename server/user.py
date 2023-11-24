from database import db
from flask_bcrypt import bcrypt
from models import User

def add_user(username, plaintext_password):
    
    hashed_password = bcrypt.hashpw(plaintext_password.encode('utf-8'), bcrypt.gensalt())
    new_user = User(username=username, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    
def get_current_user(user_id):
    return User.query.filter_by(id=user_id).first()    
    
