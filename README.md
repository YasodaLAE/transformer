# ⚡Oversight : Transformer Control System

A web application designed to manage and track inspections of electrical transformers.  
Both admins and viewers can monitor transformer data, inspection records, and gain insights from thermal image analysis.

---

## 📑 Features
- A local authentication system to differentiate between regular users and administrators.
- Administrators can `view` `add` `edit` `delete` transformers and inspections, and `view` `upload` `delete` both thermal and baseline images.
- Regular users can view all data but cannot modify it.
- Update the status of an inspection (`Pending`, `In Progress`, `Completed`).
- Colored status badges for inspections (`Pending`: red, `In Progress`: green, `Completed`: blue).
- Can search in the list of `All Transformers` by transformer number, location and transformer type.
- Can search in the list of `All Inspections` by transformer number and add inspections directly from that page.



---

## 🛠️ Setup Instructions

### ✅ Prerequisites
Make sure you have the following installed with corresponding versions:

- **Java Development Kit (JDK):** `17.0.12`  
- **Spring Boot:** `3.5.4`  
- **Apache Maven:** `3.9.11`  
- **Node.js:** `21.7.3`  
- **npm:** `10.5.0`  
- **MySQL Database:** `8.0.39`  
- **IDE (recommended):** IntelliJ IDEA 2025.2 (Community Edition)

---

### ⚙️ Backend Setup
1. Clone the repository.
   ```bash
   git clone https://github.com/YasodaLAE/transformer
2. Open the clonned project folder in your IDE.
   
3. Open the `server/src/main/resources/application.properties` file and update the below database connection properties with your MySQL username and password.
   ```bash
   spring.datasource.username=[Add Your MySQL Username Here]
   spring.datasource.password=[Add Your MySQL Password Here]
5. Start your MySQL server by running the below command in a separate command terminal and entering the password when prompted after.
   ```bash
   mysql -u root -p
6. Run the main application file `OversightApplication.java`

Now the backend server will start on `http://localhost:8080`

---

### 🌐 Frontend Setup
1. Navigate to the frontend directory
   ```bash
   cd client
2. Install the dependencies
   ```bash
   npm install
3. Run the application
   ```bash
   npm run dev

Now the frontend application will open in your browser on `http://localhost:5173`

You have to login to make any changes to the data by using any of the below `username : password` pairs.
   ```bash
admin  : 1
admin2 : 2
admin3 : 3


---