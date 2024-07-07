from flask import Flask, render_template, redirect, url_for, request, flash, jsonify, abort
import datetime, os
from django.utils.http import url_has_allowed_host_and_scheme
from urllib.parse import unquote
from flask_gravatar import Gravatar
from flask_login import UserMixin, login_user, LoginManager, current_user, logout_user, login_required

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash
from statistics import mean
from bs4 import BeautifulSoup

app = Flask(__name__, static_url_path='', static_folder='static')
app.config['SECRET_KEY'] = os.environ['SECRET_KEY']
current_year = datetime.datetime.now().year

gravatar = Gravatar(app,
                    size=100,
                    rating='g',
                    default='retro',
                    force_default=False,
                    force_lower=False,
                    use_ssl=False,
                    base_url=None)

# Configure Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'


@login_manager.user_loader
def load_user(user_id):
    return db.get_or_404(User, user_id)


# CONNECT TO DB
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///lists.db'
db = SQLAlchemy()
db.init_app(app)


class User(UserMixin, db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(250), nullable=False)
    email = db.Column(db.String(250), unique=True, nullable=False)
    password = db.Column(db.String(250), nullable=False)
    lists = relationship("_List", back_populates="user", cascade="all, delete-orphan")


class _List(db.Model):
    __tablename__ = "lists"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(250), nullable=False)
    sorting = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"))
    user = relationship("User", back_populates="lists")
    items = relationship("Item", back_populates="list", cascade="all, delete-orphan")


class Item(db.Model):
    __tablename__ = "items"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(250), nullable=False)
    sorting = db.Column(db.Integer, nullable=False)
    date = db.Column(db.DateTime, nullable=True)
    status_done = db.Column(db.Boolean, unique=False, default=False)
    list_id = db.Column(db.Integer, db.ForeignKey("lists.id", ondelete='CASCADE'))
    list = relationship("_List", back_populates="items")


with app.app_context():
    db.create_all()


def get_lists():
    """Gets the user lists and returns it as dictionary {list: items}"""
    user_lists = db.session.execute(db.select(_List).where(_List.user_id == current_user.id)).scalars().all()
    list_dict = {_list: _list.items for _list in user_lists}
    # for list in list_dict:
    #     print(f"{list.sorting} {list.name}: " + ", ".join({f"{item.sorting} {item.name}" for item in list.items}))
    return list_dict


@app.route("/")
@login_required
def home():
    user_lists = get_lists()
    return render_template("home.html", year=current_year, lists=user_lists)


@app.route("/update_sorting", methods=['POST'])
def update_sorting():
    """Extracts the lists and items from the xml-structure sent through AJAX-request,
    converts it into a dictionary {list_id: [item_id]} and updates the DB"""
    data = request.get_json()
    lists = data.get('lists')
    soup = BeautifulSoup(lists, 'html.parser')
    list_dict = {int(_list.find("input").get('id')): [int(item.get('id')[5:])
                                                      for item in _list.find_all("li", {"class": "list-item"})]
                 for _list in soup.find_all("li", {"class": "list"})}
    for i, (_list, items) in enumerate(list_dict.items()):
        if len(list_dict.items()) > 1:
            db_list = db.session.execute(db.select(_List).where(_List.id == _list)).scalar()
            db_list.sorting = i
        for h, item in enumerate(items):
            db_item = db.session.execute(db.select(Item).where(Item.id == item)).scalar()
            db_item.list_id = _list
            db_item.sorting = h
            # print(f"{db_item.list.name}: {db_item.sorting} {db_item.name}")
    db.session.commit()
    result = {"success": True}
    return jsonify(result)

@app.route('/add_list', methods=['POST'])
def add_list():
    data = request.get_json()
    new_list = data.get('new_list')
    soup = BeautifulSoup(new_list, 'html.parser')
    new_name = soup.find("span").text
    new_list = _List(
                name=new_name,
                user_id=current_user.id,
                sorting=0,
                     )
    # adjust the sorting in the db
    user_lists = db.session.execute(db.select(_List).where(_List.user_id == current_user.id)).scalars().all()
    for _list in user_lists:
        _list.sorting = _list.sorting + 1
    db.session.add(new_list)
    db.session.commit()
    return jsonify({'id': new_list.id})


@app.route('/edit_list', methods=['POST'])
def edit_list():
    data = request.get_json()
    list = data.get('list')
    soup = BeautifulSoup(list, 'html.parser')
    edited_name = soup.find('span').text
    list_id = int(soup.find("input", {"class": "list-checkbox"}).get('id'))
    print(f"{list_id}: {edited_name}")
    current_list = db.session.execute(db.select(_List).where(_List.id == list_id)).scalar()
    current_list.name = edited_name
    db.session.commit()
    return jsonify({'response': "success"})


@app.route('/delete_list', methods=['POST'])
def delete_list():
    data = request.get_json()
    delete_list = data.get('delete_list')
    soup = BeautifulSoup(delete_list, 'html.parser')
    list_id = int(soup.find("input").get('id'))
    # print(item_id)
    current_list = db.session.execute(db.select(_List).where(_List.id == list_id)).scalar()
    db.session.delete(current_list)
    db.session.commit()
    return jsonify({'response': "success"})


@app.route('/add_item', methods=['POST'])
def add_item():
    data = request.get_json()
    list_with_new_item = data.get('list')
    soup = BeautifulSoup(list_with_new_item, 'html.parser')
    list_id = int(soup.find("input").get("id"))
    new_item_name = soup.find("span", {"class": "item-name"}).text
    new_item = Item(
        name=new_item_name,
        list_id=list_id,
        sorting=0,
    )
    # adjust the sorting in the db
    current_list = db.session.execute(db.select(_List).where(_List.id == list_id)).scalar()
    for item in current_list.items:
        item.sorting = item.sorting + 1
    db.session.add(new_item)
    db.session.commit()
    return jsonify({'id': 'item_' + str(new_item.id)})


@app.route('/delete_item', methods=['POST'])
def delete_item():
    data = request.get_json()
    delete_item = data.get('delete_item')
    soup = BeautifulSoup(delete_item, 'html.parser')
    item_id = int(soup.find("li", {"class": "list-item"}).get('id')[5:])
    # print(item_id)
    current_item = db.session.execute(db.select(Item).where(Item.id == item_id)).scalar()
    db.session.delete(current_item)
    db.session.commit()
    return jsonify({'response': "success"})


@app.route('/edit_item', methods=['POST'])
def edit_item():
    data = request.get_json()
    edit_item = data.get('edit_item')
    soup = BeautifulSoup(edit_item, 'html.parser')
    edited_name = soup.find('span').text
    item_id = int(soup.find("li", {"class": "list-item"}).get('id')[5:])
    # print(f"{item_id}: {edited_name}")
    current_item = db.session.execute(db.select(Item).where(Item.id == item_id)).scalar()
    current_item.name = edited_name
    db.session.commit()
    return jsonify({'response': "success"})


@app.route('/change_item_status', methods=['POST'])
def change_item_status():
    data = request.get_json()
    edit_item = data.get('item')
    soup = BeautifulSoup(edit_item, 'html.parser')
    item_id = int(soup.find("li", {"class": "list-item"}).get('id')[5:])
    print(soup.prettify())
    # print('checked' in soup.find('input').attrs)
    current_item = db.session.execute(db.select(Item).where(Item.id == item_id)).scalar()
    # print(f"{item_id}: {current_item.status_done}")
    if current_item.status_done:
        current_item.status_done = False
    else:
        current_item.status_done = True

    db.session.commit()
    return jsonify({'response': "success"})


@app.route('/sign_up', methods=['GET', 'POST'])
def sign_up():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        if name == "" or email == "" or password == "":
            flash('please fill in all fields')
            return redirect(url_for('sign_up'))
        if db.session.execute(db.select(User).where(User.email == email)).scalar():
            flash("You've already signed up with that email, log in instead!")
            return redirect(url_for('login'))
        new_user = User(name=name,
                        email=email,
                        password=generate_password_hash(password, method='pbkdf2:sha256', salt_length=8)
                        )
        db.session.add(new_user)
        db.session.commit()
        login_user(new_user)
        return redirect(url_for('home'))
    print('GET')
    return render_template("sign_up.html", year=current_year)


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        remember_me = True if request.form.get('remember-me') else False
        user = db.session.execute(db.select(User).where(User.email == email)).scalar()
        if not user:
            flash("No user registered with this email")
            return redirect(url_for('login'))
        elif not check_password_hash(user.password, password):
            flash("Wrong password, please try again")
            return redirect(url_for('login'))
        else:
            login_user(user, remember=remember_me)
            next = request.form.get('next') or request.args.get('next')
            print(f"Next URL: {next}")
            print(f"Request Host: {request.host}")
            if not url_has_allowed_host_and_scheme(next, request.host):
                print(next)
                print(request.host)
                return abort(400)

            return redirect(next or url_for('home'))

    next_url = request.args.get('next')

    return render_template("login.html", year=current_year, next=next_url)


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


# with app.app_context():
#     new_user = User(
#         name='admin',
#         email='admin@yahoo.it',
#         password=generate_password_hash('admin', method='pbkdf2:sha256', salt_length=8)
#     )
#     new_list1 = _List(
#                 name="Chores",
#                 user_id=1,
#                 sorting=1,
#                      )
#
#     new_list2 = _List(
#         name="Grocery",
#         user_id=1,
#         sorting=2,
#     )
#
#     new_item1 = Item(
#         name="Dust",
#         date=datetime.datetime(2024, 5, 7, 23, 15),
#         list_id=1,
#         sorting=1,
#     )
#
#     new_item2 = Item(
#         name="Mope",
#         date=datetime.datetime(2024, 5, 7, 23, 15),
#         list_id=1,
#         sorting=2,
#     )
#
#     new_item3 = Item(
#         name="Cabbage",
#         date=datetime.datetime(2024, 5, 7, 23, 15),
#         list_id=2,
#         sorting=1,
#     )
#
#     new_item4 = Item(
#         name="Broccoli",
#         date=datetime.datetime(2024, 5, 7, 23, 15),
#         list_id=2,
#         sorting=2,
#     )
#
#     db.session.add(new_user)
#     db.session.add(new_list1)
#     db.session.add(new_list2)
#     db.session.add(new_item1)
#     db.session.add(new_item2)
#     db.session.add(new_item3)
#     db.session.add(new_item4)
#     db.session.commit()


if __name__ == '__main__':
    app.run(debug=True, port=5000)
