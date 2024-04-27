var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect(process.env.DB);

// Movie schema
var MovieSchema = new Schema({
    title: { type: String, required: true, index: true },
    releaseDate: Date,
    genre: { 
      type: String,
      enum: [
        'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Thriller', 'Western', 'Science Fiction'
      ],
    },
    actors: [{
      actorName: String,
      characterName: String,
    }],
    imageUrl: { type: String, default: 'https://cdn.pixabay.com/photo/2024/04/08/16/54/ai-generated-8683952_1280.jpg' }
  });

// return the model
var Movie = mongoose.model('Movie', MovieSchema);
module.exports = Movie;
