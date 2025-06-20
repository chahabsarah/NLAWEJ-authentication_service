const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Blog = require("../models/Blog");
const Comment = require("../models/Comment");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/blogs-images");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".avif", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error("Seuls les fichiers JPG, JPEG et PNG sont autorisés."));
    }
    cb(null, true);
  },
});
const getBlogs = async (req, res) => {
    try {
      const blogs = await Blog.find().sort({ createdAt: -1 });
      const updatedBlogs = blogs.map(blog => ({
        ...blog._doc, 
        blogImage: blog.image ? blog.image.replace(/\\/g, "/") : null 
      }));

      res.status(200).json(updatedBlogs);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des blogs", error });
    }
  };

const getBlogById = async (req, res) => {
  try {
        const { id } = req.params;
        const blog = await Blog.findById(id);
        res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de blog", error });
  }
};
const createBlog = async (req, res) => {
  try {
    const { title, content, excerpt } = req.body;
    const imagePath = req.file ? req.file.path : null;

    const newBlog = new Blog({
      title,
      content,
      excerpt,
      image: imagePath,
    });

    await newBlog.save();
    res.status(201).json({ message: "Blog créé avec succès", blog: newBlog });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création de blog", error });
  }
};

const updateBlog = async (req, res) => {
    try {

      const { title, content, excerpt } = req.body;
      let updatedData = { title, content, excerpt };
      if (req.file) {
        const newImagePath = req.file.path.replace(/\\/g, "/");
        const blog = await Blog.findById(req.params.id);
        if (blog && blog.image && fs.existsSync(blog.image)) {
          fs.unlinkSync(blog.image);
        }
        updatedData.image = newImagePath;
      }
      const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, updatedData, { new: true });
      if (!updatedBlog) return res.status(404).json({ message: "Blog non trouvé" });

      res.json({ message: "blog mis à jour avec succès", blog: updatedBlog });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de blog", error });
    }
  };
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog non trouvé" });

    if (blog.image) {
      fs.unlinkSync(blog.image);
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: "Blog supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de Blog", error });
  }
};
const toggleLike = async (req, res) => {
 try {
  const {id} = req.params;
  const {userId} = req.body;
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    await blog.toggleLike(userId);
    const updatedBlog = await Blog.findById(id)
      .populate('likes', 'fullName profileImage')
      .populate('comments')
      .populate('comments.owner','fullName');

    res.status(200).json(updatedBlog);
  } catch (error) {
    res.status(500).json({ message: "Error toggling like", error });
  }
};


const addComment = async (req, res) => {
  try {
    const { content, owner } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    if (!owner) {
      return res.status(401).json({ message: "we don't recognize you bro!" });
    }

    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const newComment = new Comment({ owner, content });
    await newComment.save();

    blog.comments.push(newComment._id);
    const savedBlog = await blog.save();

    await savedBlog.populate({
      path: 'comments',
      populate: { path: 'owner', select: 'fullName profileImage' }
    });

    res.status(201).json(savedBlog.comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding comment", error });
  }
};


const deleteComment = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog non trouvé" });

    const commentIndex = blog.comments.findIndex(
      c => c._id.toString() === req.params.commentId
    );

    if (commentIndex === -1) return res.status(404).json({ message: "Commentaire non trouvé" });

    if (blog.comments[commentIndex].user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    blog.comments.splice(commentIndex, 1);
    await blog.save();

    res.status(200).json({ message: "Commentaire supprimé" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error });
  }
};
const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id).populate({
      path: 'comments',
      populate: { path: 'owner', select: 'fullName profileImage' }
    });

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.status(200).json(blog.comments);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des commentaires', error });
  }
};

module.exports = { getBlogs, getBlogById, createBlog, updateBlog, deleteBlog, upload,
deleteComment,addComment,toggleLike , getComments};
