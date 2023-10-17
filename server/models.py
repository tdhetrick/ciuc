from database import db
import datetime

user_classes = db.Table('user_classes',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
    db.Column('class_id', db.Integer, db.ForeignKey('class.id'))
)

# user_assignments = db.Table('user_assignments',
#     db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
#     db.Column('assignment_id', db.Integer, db.ForeignKey('assignment.id'))
# )

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    password = db.Column(db.String(120), nullable=False)
    fname = db.Column(db.String(50), nullable=False)  
    lname = db.Column(db.String(50), nullable=False) 
    email = db.Column(db.String(100), nullable=False, unique=True)  
    classes = db.relationship('Class', secondary=user_classes, backref='students')
    #assignments = db.relationship('Assignment', secondary=user_assignments, backref='students')
    assigned_tasks = db.relationship('UserAssignment', back_populates='user')

    def __init__(self, username, password, fname, lname, email):
        self.username = username
        self.password = password
        self.fname = fname
        self.lname = lname
        self.email = email


class Class(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    classname = db.Column(db.String(50), nullable=False)
    coursenumber = db.Column(db.String(16), nullable=False)   
    username = db.Column(db.String(50))
    assignments = db.relationship('Assignment', backref='class', lazy=True)

    def __init__(self, classname, coursenumber):
        self.classname = classname
        self.coursenumber = coursenumber


class Assignment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)  
    class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=False)
    users_with_assignment = db.relationship('UserAssignment', backref='assignment')


    def __init__(self, title, class_id):
        self.title = title
        self.class_id = class_id
        
class UserAssignment(db.Model):
    id = db.Column(db.Integer, primary_key=True)  # A primary key for this table
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    assignment_id = db.Column(db.Integer, db.ForeignKey('assignment.id'))
    unique_key = db.Column(db.String(120), unique=True, nullable=False)
    
    # Relationships
    user = db.relationship('User', back_populates='assigned_tasks')
    #assignment = db.relationship('Assignment', back_populates='users_with_assignment')

    def __init__(self, user_id, assignment_id, unique_key):
        self.user_id = user_id
        self.assignment_id = assignment_id
        self.unique_key = unique_key

        
class CodeEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    assignment_key = db.Column(db.String(16), nullable=False)
    time = db.Column(db.DateTime)
    lev_count = db.Column(db.Integer)  
    event = db.Column(db.String(16))
 
    def __init__(self, assignment_key, time ,lev_count ,event):
        self.assignment_key = assignment_key
        self.time = time
        self.lev_count = lev_count
        self.event = event
