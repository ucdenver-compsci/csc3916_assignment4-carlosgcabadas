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
    imageUrl: { type: String, default: 'https://cdn.pixabay.com/photo/2024/04/08/16/54/ai-generated-8683952_1280.jpg' },
  });

// return the model
module.exports = mongoose.model('Movie', MovieSchema);


// Add five movies to the database
Movie.countDocuments((err, count) => {
  if (err) {
      console.log('Error counting documents:', err);
  } else if (count === 0) {
      Movie.insertMany([
          {
              title: 'The Dark Knight',
              releaseDate: new Date(2008, 7, 18),
              genre: 'Action',
              actors: [{ actorName: 'Christian Bale', characterName: 'Bruce Wayne' }, { actorName: 'Heath Ledger', characterName: 'Joker' }],
              imageUrl: 'https://cdn.pixabay.com/photo/2024/04/08/16/54/ai-generated-8683952_1280.jpg'
          },
          {
              title: 'Inception',
              releaseDate: new Date(2010, 7, 16),
              genre: 'Science Fiction',
              actors: [{ actorName: 'Leonardo DiCaprio', characterName: 'Cobb' }, { actorName: 'Joseph Gordon-Levitt', characterName: 'Arthur' }],
              imageUrl: 'https://cdn.pixabay.com/photo/2024/04/08/16/54/ai-generated-8683952_1280.jpg'
          },
          {
              title: 'The Matrix',
              releaseDate: new Date(1999, 3, 31),
              genre: 'Science Fiction',
              actors: [{ actorName: 'Keanu Reeves', characterName: 'Neo' }, { actorName: 'Laurence Fishburne', characterName: 'Morpheus' }],
              imageUrl: 'https://cdn.pixabay.com/photo/2024/04/08/16/54/ai-generated-8683952_1280.jpg'
          },
          {
              title: 'The Lord of the Rings: The Fellowship of the Ring',
              releaseDate: new Date(2001, 12, 19),
              genre: 'Fantasy',
              actors: [{ actorName: 'Elijah Wood', characterName: 'Frodo' }, { actorName: 'Ian McKellen', characterName: 'Gandalf' }],
              imageUrl: 'https://cdn.pixabay.com/photo/2024/04/08/16/54/ai-generated-8683952_1280.jpg'
          },
          {
              title: 'The Shawshank Redemption',
              releaseDate: new Date(1994, 9, 14),
              genre: 'Drama',
              actors: [{ actorName: 'Tim Robbins', characterName: 'Andy Dufresne' }, { actorName: 'Morgan Freeman', characterName: 'Ellis Boyd Redding' }],
              imageUrl: 'https://cdn.pixabay.com/photo/2024/04/08/16/54/ai-generated-8683952_1280.jpg'
          }
      ], (err) => {
          if (err) {
              console.log('Error inserting movies:', err);
          } else {
              console.log('Successfully inserted 5 movies');
          }
      });
  }
});