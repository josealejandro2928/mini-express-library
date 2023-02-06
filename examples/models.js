
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
        this.tasks = [];
        this.id = User.id++;
    }


    static async getListUsers() {
        return new Promise((res) => {
            res(users);
        })
    }
    static async createUser(name, lastName, age) {
        return new Promise((res) => {
            const newUser = new User(name, lastName, age);
            users.push(newUser);
            res(newUser);
        })
    }
    static async deleteUser(id) {
        return new Promise((res) => {
            const user = users.find((u) => u.id == id);
            if (!user) throw new Error("User not found");
            users = users.filter((u) => u.id != id);
            res(true);
        })
    }
    static async getUserById(id) {
        return new Promise((res) => {
            const user = users.find((u) => u.id == id);
            res(user);
        })
    }
    static async editUser(user) {
        return new Promise((res) => {
            const userIndex = users.findIndex((u) => u.id == user.id);
            if (userIndex == -1) throw new Error("User not found");
            users[userIndex] = user
            res(user);
        })
    }

}
let users = [new User("Jose", "Alejandro", 27), new User("Carlos", "Perez", 20)]
const populate = () => {
    for (let i = 0; i < 100; i++) {
        users.push(new User(`user-name-${i}`, `user-lastname-${i}`, 10 + Math.floor(Math.random() * 100)))
    }
}
populate();
module.exports = {
    User: User,
}