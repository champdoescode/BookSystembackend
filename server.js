const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors());

const uri = 'mongodb+srv://booksystemuser1:tGWLthbJst9kju2j@booksystem.e6kcjyz.mongodb.net/databasebook';
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  fullName: String,
  username: String,
  email: String,
  mobileNumber: String,
  password: String,
  userType: String,
  loginTime: Date,
  logoutTime: Date
}, { collection: 'registrationdata' });

const bookSchema = new mongoose.Schema({
  bookName: String,
  bookAuthor: String,
  bookPrice: String,
  bookImage: String,
  bookDescription: String,
  numberOfCopies: String,
}, { collection: 'addbook' });

const purchasedSchema = new mongoose.Schema({
  bookName: String,
  bookAuthor: String,
  bookPrice: String,
  bookImage: String,
  bookDescription: String,
  userName: String,
  email: String,
  address: String,
  pinCode: String,
  city: String,
  state: String,
  paymentMode: String
}, { collection: 'purchased' });

const User = mongoose.model('User', userSchema);
const Book = mongoose.model('Book', bookSchema);
const Purchased = mongoose.model('Purchased', purchasedSchema);

app.post('/register', async (req, res) => {
  const { fullName, username, email, mobileNumber, password, userType } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ fullName, username, email, mobileNumber, password: hashedPassword, userType });
    await user.save();
    res.status(201).send('User registered successfully');
  } catch (error) {
    res.status(400).send('Error registering user');
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user && bcrypt.compare(password, user.password)) {
      user.loginTime = new Date();
      await user.save();
      res.status(200).json({ message: 'Login successful', userType: user.userType });
    } else {
      res.status(400).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

app.post('/logout', async (req, res) => {
  const { username } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user) {
      user.logoutTime = new Date();
      await user.save();
      res.status(200).json({ message: 'Logout successful' });
    } else {
      res.status(400).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error logging out' });
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).send('Error fetching users');
  }
});

app.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).send('User deleted successfully');
  } catch (error) {
    res.status(500).send('Error deleting user');
  }
});

app.post('/addbook', async (req, res) => {
  const { bookName, bookAuthor, bookPrice, bookImage, bookDescription, numberOfCopies } = req.body;
  try {
    const book = new Book({ bookName, bookAuthor, bookPrice, bookImage, bookDescription, numberOfCopies });
    await book.save();
    res.status(201).send('Book added successfully');
  } catch (error) {
    res.status(400).send('Error adding book');
  }
});

app.get('/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    res.status(500).send('Error fetching books');
  }
});

app.put('/books/:id', async (req, res) => {
  const { id } = req.params;
  const { bookName, bookAuthor, bookPrice, bookDescription, numberOfCopies } = req.body;

  try {
    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { bookName, bookAuthor, bookPrice, bookDescription, numberOfCopies },
      { new: true }
    );

    if (!updatedBook) {
      return res.status(404).send('Book not found');
    }

    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(400).send('Error updating book');
  }
});

app.post('/purchase', async (req, res) => {
  const { bookId, userName, email, address, pinCode, city, state, paymentMode } = req.body;
  try {
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).send('Book not found');
    }

    const purchase = new Purchased({
      bookName: book.bookName,
      bookAuthor: book.bookAuthor,
      bookPrice: book.bookPrice,
      bookImage: book.bookImage,
      bookDescription: book.bookDescription,
      userName,
      email,
      address,
      pinCode,
      city,
      state,
      paymentMode
    });

    await purchase.save();

    book.numberOfCopies = (parseInt(book.numberOfCopies) - 1).toString();
    await book.save();

    res.status(201).send('Book purchased successfully');
  } catch (error) {
    res.status(400).send('Error purchasing book');
  }
});

app.get('/purchases', async (req, res) => {
  try {
    const purchases = await Purchased.find();
    res.status(200).json(purchases);
  } catch (error) {
    res.status(500).send('Error fetching purchases');
  }
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
