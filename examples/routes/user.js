/* eslint-disable @typescript-eslint/no-var-requires */
const { Router, ServerError } = require("../../build/cjs/index");
const { authorizationMidd } = require("../middlewares");
const { User } = require("../models")

const userByIdMiddleware = async (req, res, next) => {
    const userId = req.params.userId;
    const user = await User.getUserById(userId);
    if (!user) throw new ServerError(404, `User with id=${userId} not found, try with other id`);
    req.context.user = user;
    next();
}

const router = new Router();

router.get("/", async (req, res) => {
    let users = await User.getListUsers()
    res.status(200).json({ data: users });
})

router.get("/:userId", userByIdMiddleware, async (req, res) => {
    res.status(200).json({ data: req.context.user });
})

router.post("/", async (req, res) => {
    let data = req.body;
    let newUser = await User.createUser(data.name, data.lastName, data.age);
    res.status(201).json({ data: newUser });
})

router.post("/:userId/task", authorizationMidd, async (req, res) => {
    let data = req.body;
    if (req.loggedUser.id != req.params.userId) {
        throw new ServerError(403, "Not allowed", ["you can edit other users"]);
    }
    let user = req.loggedUser;
    user.tasks = [...new Set([...user.tasks, ...data.tasks])]
    user = await User.editUser(user);
    res.status(201).json({ data: user });
})

router.put("/:userId", userByIdMiddleware, async (req, res) => {
    let user = req.context.user;
    let data = req.body;
    if (data.name != undefined) {
        user.name = data.name;
    }
    if (data.lastName != undefined) {
        user.lastName = data.lastName;
    }
    if (data.age != undefined) {
        user.age = data.age;
    }
    user = await User.editUser(user);
    res.status(201).json({ data: user });
})

router.delete("/:userId", authorizationMidd, async (req, res) => {
    if (req.loggedUser.id != req.params.userId) {
        throw new ServerError(403, "Not allowed", ["you can edit other users"]);
    }
    let user = req.loggedUser;
    await User.deleteUser(user.id)
    res.status(200).json({ status: "Ok" });
})
///////////////////////////////////////////////////////////////////////
module.exports = router