from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Email, EqualTo, Length
from wtforms_sqlalchemy.fields import QuerySelectField, QuerySelectMultipleField
from models import *


class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')
    

class UserRegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=4, max=50)])
    password = PasswordField('Password', validators=[DataRequired()])
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
    fname = StringField('First Name', validators=[DataRequired(), Length(max=50)])
    lname = StringField('Last Name', validators=[DataRequired(), Length(max=50)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    submit = SubmitField('Register')


class UserModificationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=4, max=50)])
    password = PasswordField('New Password', validators=[DataRequired()])
    confirm_password = PasswordField('Confirm New Password', validators=[DataRequired(), EqualTo('password')])
    fname = StringField('First Name', validators=[DataRequired(), Length(max=50)])
    lname = StringField('Last Name', validators=[DataRequired(), Length(max=50)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    submit = SubmitField('Update Info')
    
class ClassForm(FlaskForm):
    classname = StringField('Class Name', validators=[DataRequired(), Length(max=50)])
    coursenumber = StringField('Course Number', validators=[DataRequired(), Length(max=16)])
    #username = StringField('Username', validators=[DataRequired(), Length(max=50)])
    submit = SubmitField('Add Class')
    
class AssignClassForm(FlaskForm):
    user = QuerySelectField('User', query_factory=lambda: User.query.all(), get_label="username")
    classes = QuerySelectMultipleField('Classes', query_factory=lambda: Class.query.all(), get_label="classname")
    submit = SubmitField('Assign Class')
    
class AssignAssignmentForm(FlaskForm):
    user = QuerySelectField('User', query_factory=lambda: User.query.all(), get_label="username")
    assignments = QuerySelectMultipleField('Assignments', query_factory=lambda: Assignment.query.all(), get_label="title")
    submit = SubmitField('Assign Assignment')

class AssignmentForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired()])
    classes = QuerySelectField('Classes', query_factory=lambda: Class.query.all(), get_label="classname")
    submit = SubmitField('Add Assignment')