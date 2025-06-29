const User = require('../models/User');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).select('-password -otp -otpExpiresAt');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if profile fields are set
    const profileFields = ['campus', 'batch', 'profilePhoto', 'gender', 'age', 'aboutMe', 'nickname'];
    const isProfileSet = profileFields.some(field => user[field]);

    if (!isProfileSet) {
      return res.status(200).json({ message: 'Profile not set yet' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const updateFields = {};
    const allowedFields = ['campus', 'batch', 'profilePhoto', 'gender', 'age', 'aboutMe', 'nickname'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updateFields[field] = req.body[field];
    });
    const user = await User.findByIdAndUpdate(userId, updateFields, { new: true, runValidators: true, upsert: true }).select('-password -otp -otpExpiresAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete user profile
exports.deleteProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Profile deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create user profile
exports.createProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const existingUser = await User.findById(userId);
    if (!existingUser) return res.status(404).json({ message: 'User not found' });
    // If profile fields already exist, treat as already created
    if (existingUser.campus || existingUser.batch || existingUser.gender || existingUser.age || existingUser.aboutMe || existingUser.nickname || existingUser.profilePhoto) {
      return res.status(400).json({ message: 'Profile already exists' });
    }
    const allowedFields = ['campus', 'batch', 'profilePhoto', 'gender', 'age', 'aboutMe', 'nickname'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) existingUser[field] = req.body[field];
    });
    await existingUser.save();
    res.json(existingUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 

exports.uploadProfilePhoto = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const user = await User.findByIdAndUpdate(
      userId,
      { profilePhoto: `/uploads/${req.file.filename}` },
      { new: true }
    ).select('-password -otp -otpExpiresAt');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};