
class User {
    static id = 1;
    constructor(name, lastName, age) {
        if (!name) {
            throw { code: 400, message: "name is required" }
        }
        this.name = name;
        if (!lastName) {
            throw { code: 400, message: "lastName is required" }
        }
        this.lastName = lastName;
        if (!age) {
            throw { code: 400, message: "age is required" }
        }
        this.age = age;
        if (isNaN(parseInt(this.age))) {
            throw { code: 400, message: "age must be an integer" }
        }
        this.id = User.id++;
    }
    
    
    static async getListUsers() {
        return new Promise((res, rej) => {
            res(users);
        })
    }
    static async createUser(name, lastName, age) {
        const newUser = new User(name, lastName, age);
        return new Promise((res, rej) => {
            res(newUser);
        })
    }
    static async deleteUser(id) {
        const user = users.find((u) => u.id == id);
        if (!user) throw new Error("User not found");
        users = users.filter((u) => u.id != id);
        return new Promise((res, rej) => {
            res(true);
        })
    }
    static async getUserById(id) {
        return new Promise((res, rej) => {
            const user = users.find((u) => u.id == id);
            res(user);
        })
    }
    static async editUser(user) {
        const userIndex = users.findIndex((u) => u.id == id);
        if (userIndex == -1) throw new Error("User not found");
        users[userIndex] = user
        return new Promise((res, rej) => {
            res(user);
        })
    }
    
}
const users = [new User("Jose", "Alejandro", 27), new User("Carlos", "Perez", 20)]

module.exports = {
    User: User,
    
}