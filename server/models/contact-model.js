const { Schema, model } = require("mongoose");

const contactSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            match: /.+\@.+\..+/ // Regex to validate email format
        },
        message: {
            type: String,
            required: true,
        },
    },
    { timestamps: true } // Automatically manage createdAt and updatedAt fields
);

// Create a new collection (Model)
const Contact = model("Contact", contactSchema);

module.exports = Contact;
