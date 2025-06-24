# 🛒 Product CRUD API

A simple RESTful API built with **Node.js**, **Express**, and **MongoDB** using **Mongoose**. This API allows you to **Create**, **Read**, **Update**, and **Delete** (CRUD) products in a MongoDB database.

---

## 📦 Features

- Add new products
- Get a list of all products
- Get a specific product by ID
- Update a product by ID
- Delete a product by ID

---

## 🧰 Tech Stack

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)

---

## 📁 Project Structure

.
├── index.js # Main server file with all routes
├── models/
│ └── product.model.js # Mongoose schema for Product
├── package.json
└── README.md



---

## 🧑‍💻 Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/malombe-dev/product-crud-api.git
cd product-crud-api
2. Install dependencies

npm install

3. Add MongoDB connection string
Update the mongoose.connect(...) URI in index.js with your own MongoDB URI or use the provided connection string if you're using the same database.

4. Run the server

node index.js
Or use nodemon (recommended for development):


npx nodemon index.js
📬 API Endpoints
Method	Endpoint	Description
GET	/	Welcome message
POST	/api/products	Create a new product
GET	/api/products	Get all products
GET	/api/products/:id	Get a product by ID
PUT	/api/products/:id	Update a product by ID
DELETE	/api/products/:id	Delete a product by ID

📌 Sample Product Object

{
  "name": "Sample Product",
  "quantity": 10,
  "price": 29.99,
  "image": "https://example.com/image.jpg"
}
🧪 Testing with Postman
You can test the API endpoints using Postman or any other API client. Just make sure your server is running on http://localhost:3000.

✅ License
This project is open-source and free to use.

👨‍💻 Author
Vincent Malombe
Feel free to connect and contribute!


