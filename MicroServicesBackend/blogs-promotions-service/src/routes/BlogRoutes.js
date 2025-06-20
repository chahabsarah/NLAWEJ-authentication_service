const express = require("express");
const router = express.Router();
const BlogController = require("../controllers/BlogController");
const { authenticateUserByJwt } = require('../middlewares/JWT');

router.get("/all", authenticateUserByJwt, BlogController.getBlogs);
router.get("/:id", authenticateUserByJwt, BlogController.getBlogById);
router.post("/add",  authenticateUserByJwt,BlogController.upload.single("image"), BlogController.createBlog);
router.put("/update/:id", authenticateUserByJwt, BlogController.upload.single("image"), BlogController.updateBlog);
router.delete("/delete/:id",  authenticateUserByJwt,BlogController.deleteBlog);
router.post("/:id/like", authenticateUserByJwt, BlogController.toggleLike);
router.post("/:id/comment", authenticateUserByJwt, BlogController.addComment);
router.delete("/:id/comment/:commentId", authenticateUserByJwt, BlogController.deleteComment);
router.get('/:id/comments',  authenticateUserByJwt, BlogController.getComments);

module.exports = router;
