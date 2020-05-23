import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title must be required'],
  },
  caption: String,
  src: {
    type: String,
    required: [true, 'Photo field must not be blank'],
  },
  imgPath: String,
  location: String,
  tags: [String],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

const Photo = mongoose.model('Photos', photoSchema);

export default Photo;
