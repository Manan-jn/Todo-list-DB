const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb+srv://admin-manan:test123@cluster0.x45lx.mongodb.net/todoListDb", { useNewUrlParser: true, useUnifiedTopology: true });

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const default1 = new Item({
    name: "Welcome to your todo list",
});
const default2 = new Item({
    name: "Hit the + button to add a new item"
});
const default3 = new Item({
    name: "<-- Hit this checkbox to delete an item"
});
const defaultItems = [default1, default2, default3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log("Error");
                }
                else {
                    console.log("Succesfully added");
                }
            })
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newItems: foundItems
            });
        }

    });

})

app.post("/", function (req, res) {
    let itemName = req.body.toDo;
    const listName = req.body.list;

    const userItem = new Item({
        name: itemName
    });

    if (listName === "Today") {
        userItem.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, function (err, foundList) {
            foundList.items.push(userItem);
            foundList.save();
            res.redirect("/" + listName);
        });
    }

})

app.post("/delete", function (req, res) {
    let checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (err) {
                console.log("Error removing the checked item");
            }
            else {
                console.log("Succesfully removed the checked item from the list");
                res.redirect("/");
            }
        });
    }
    else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }

});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                //create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            }
            else {
                //show the existing lis
                res.render("list", {
                    listTitle: foundList.name,
                    newItems: foundList.items
                });
            }
        }

    });
});

app.listen(process.env.PORT || 3000, function () {
    console.log("Server started SUCCESSFULLY");
})
