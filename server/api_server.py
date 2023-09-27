from flask import Flask, request, jsonify, render_template, redirect, url_for, flash, session
from flask_cors import CORS
#from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from database import db


from forms import *
from models import *
from user import *


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ciuc.db'
app.config['SECRET_KEY'] = 'fj49j483hti95jt'

db.init_app(app)
with app.app_context():
    db.create_all()  
    
CORS(app)

@app.route('/')
def home():
    if session.get('username'):
        return render_template('home.html')
    else:
        #add_user('thetrick', '123456')
        return redirect(url_for('login')) 

@app.route('/databucket', methods=['POST'])
def receive_data():
    print("Received data start:")
    data = request.json
    if not data:
        return jsonify({'message': 'No data provided'}), 400

    print("Received data:", len(data))
    

    return jsonify({'message': 'Data received successfully'}), 200

@app.route('/login', methods=['GET','POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and bcrypt.checkpw(form.password.data.encode('utf-8'), user.password):
            flash('Successfully logged in!', 'success')
            session['username'] = user.username
            session['user_id'] = user.id
            return redirect(url_for('home'))
        else:
            flash('Login unsuccessful. Please check username and password.', 'danger')
    return render_template('login.html', form=form)

@app.route('/logout', methods=['GET'])
def logout():
    if session.get('username'):
        session.clear()

    return redirect(url_for('home')) 

@app.route('/register', methods=['GET', 'POST'])
def user_reg():
    form = UserRegistrationForm()

    if form.validate_on_submit():
        
        existing_user = User.query.filter_by(username=form.username.data).first()

        if existing_user:
            flash('Username already exists. Please choose a different one.', 'danger')
            return render_template('user_reg_mod.html', form=form, title="Register")
 
        user = User(username=form.username.data,
                    password= bcrypt.hashpw(form.password.data.encode('utf-8'), bcrypt.gensalt()),
                    fname=form.fname.data,
                    lname=form.lname.data,
                    email=form.email.data)
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful!', 'success')
        return redirect(url_for('home'))

    return render_template('user_reg_mod.html', form=form, title="Register")

@app.route('/modify/<int:user_id>', methods=['GET', 'POST'])
def user_modify(user_id):
    user = User.query.get_or_404(user_id)
    form = UserModificationForm()

    if form.validate_on_submit():
        # Update user info
        user.username = form.username.data
        user.password = bcrypt.hashpw(form.password.data.encode('utf-8'), bcrypt.gensalt())
        user.fname = form.fname.data
        user.lname = form.lname.data
        user.email = form.email.data

        db.session.commit()
        
        flash('User info updated successfully!', 'success')
        return redirect(url_for('home'))
    elif request.method == 'GET':
        form.username.data = user.username
        form.fname.data = user.fname
        form.lname.data = user.lname
        form.email.data = user.email

    return render_template('user_reg_mod.html', form=form, title="Modify User Info")

@app.route('/users')
def users_list():
    users = User.query.all()

    return render_template('user_mgt.html', users=users)

@app.route('/list_classes')
def list_classes():
    classes = Class.query.all()
    return render_template('classes.html', classes=classes)

@app.route('/add_class', methods=['GET', 'POST'])
def add_class():
    form = ClassForm()
    
    
    if form.validate_on_submit():
    
        new_class = Class(
            classname=form.classname.data,
            coursenumber=form.coursenumber.data
        )

        db.session.add(new_class)
        db.session.commit()

        flash('Class added successfully!', 'success')
        return redirect(url_for('list_classes'))
    else:
        
        for field, errors in form.errors.items():
            for error in errors:
                print(f"Error in {field}: {error}", 'danger')
                flash(f"Error in {field}: {error}", 'danger')

    return render_template('class_add_mod.html', form=form)



@app.route('/modify_class/<int:class_id>', methods=['GET', 'POST'])
def modify_class(class_id):
    class_item = Class.query.get_or_404(class_id)
    form = ClassForm(obj=class_item)  

    if form.validate_on_submit():
        class_item.classname = form.classname.data
        class_item.coursenumber = form.coursenumber.data
        

        db.session.commit()
        
        flash('Class updated successfully!', 'success')
        return redirect(url_for('list_classes'))

    return render_template('class_add_mod.html', form=form)


@app.route('/delete_class/<int:class_id>', methods=['GET', 'POST'])
def delete_class(class_id):
    class_item = Class.query.get_or_404(class_id)
    db.session.delete(class_item)
    db.session.commit()
    return redirect(url_for('list_classes'))

@app.route('/assign_class', methods=['GET', 'POST'])
def assign_class():
    form = AssignClassForm()
    if form.validate_on_submit():
        user = form.user.data
        for class_ in form.classes.data:
            user.classes.append(class_)
        db.session.commit()
        flash('Classes assigned successfully!', 'success')
        return redirect(url_for('home'))
    return render_template('assign_class.html', form=form)

@app.route('/assign_assignment', methods=['GET', 'POST'])
def assign_assignment():
    form = AssignAssignmentForm()
    if form.validate_on_submit():
        user = form.user.data
        for assignment in form.assignments.data:
            user.assignments.append(assignment)
        db.session.commit()
        flash('Assignments assigned successfully!', 'success')
        return redirect(url_for('home'))
    return render_template('assign_assignment.html', form=form)




if __name__ == '__main__':
    app.run(debug=True)
