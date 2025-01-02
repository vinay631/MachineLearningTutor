import { db } from "./index";
import { lessons, questions, codingExercises } from "./schema";

async function seed() {
  try {
    // Insert ML Lessons
    const [introLesson] = await db.insert(lessons).values({
      title: "Introduction to Machine Learning",
      description: "Learn the basic concepts and terminology of Machine Learning",
      difficulty: 1,
      order: 1,
      module: "Fundamentals",
      type: "quiz"
    }).returning();

    const [pythonLesson] = await db.insert(lessons).values({
      title: "Python for ML",
      description: "Essential Python concepts for Machine Learning",
      difficulty: 1,
      order: 2,
      module: "Fundamentals",
      type: "coding"
    }).returning();

    const [nnLesson] = await db.insert(lessons).values({
      title: "Neural Networks Basics",
      description: "Understanding the fundamentals of Neural Networks",
      difficulty: 2,
      order: 1,
      module: "Neural Networks",
      type: "quiz"
    }).returning();

    // Insert Quiz Questions
    await db.insert(questions).values([
      {
        lessonId: introLesson.id,
        question: "What is Machine Learning?",
        options: JSON.stringify([
          "A type of computer hardware",
          "The ability of systems to learn from data",
          "A programming language",
          "A database management system"
        ]),
        correctAnswer: "The ability of systems to learn from data",
        explanation: "Machine Learning is a subset of AI that enables systems to learn and improve from experience without being explicitly programmed."
      },
      {
        lessonId: introLesson.id,
        question: "Which of these is a type of Machine Learning?",
        options: JSON.stringify([
          "Supervised Learning",
          "Random Learning",
          "Manual Learning",
          "Static Learning"
        ]),
        correctAnswer: "Supervised Learning",
        explanation: "Supervised Learning is a type of ML where the model learns from labeled data to make predictions."
      },
      {
        lessonId: nnLesson.id,
        question: "What is a neuron in a Neural Network?",
        options: JSON.stringify([
          "A type of computer virus",
          "A mathematical function that processes inputs",
          "A programming language",
          "A database table"
        ]),
        correctAnswer: "A mathematical function that processes inputs",
        explanation: "A neuron is a basic unit in a neural network that takes inputs, applies weights and biases, and produces an output through an activation function."
      }
    ]);

    // Insert Coding Exercises
    await db.insert(codingExercises).values([
      {
        lessonId: pythonLesson.id,
        title: "NumPy Arrays",
        description: "Create and manipulate NumPy arrays for ML",
        initialCode: "import numpy as np\n\n# Create a 2x3 array with random numbers\ndef create_array():\n    # Your code here\n    pass",
        solution: "import numpy as np\n\ndef create_array():\n    return np.random.rand(2, 3)",
        testCases: JSON.stringify([
          {
            test: "arr = create_array()\ntype(arr).__module__ == 'numpy' and arr.shape == (2, 3)",
            message: "Array should be a 2x3 NumPy array"
          }
        ]),
        hints: JSON.stringify([
          "Use np.random.rand() to create random numbers",
          "The function should return a NumPy array with shape (2, 3)",
          "Make sure to import numpy as np at the start"
        ])
      },
      {
        lessonId: pythonLesson.id,
        title: "Matrix Operations",
        description: "Perform basic matrix operations using NumPy",
        initialCode: "import numpy as np\n\n# Multiply two matrices\ndef matrix_multiply(A, B):\n    # Your code here\n    pass",
        solution: "import numpy as np\n\ndef matrix_multiply(A, B):\n    return np.dot(A, B)",
        testCases: JSON.stringify([
          {
            test: "A = np.array([[1, 2], [3, 4]])\nB = np.array([[5, 6], [7, 8]])\nresult = matrix_multiply(A, B)\nnp.array_equal(result, np.dot(A, B))",
            message: "Matrix multiplication should be performed correctly"
          }
        ]),
        hints: JSON.stringify([
          "Use np.dot() for matrix multiplication",
          "Make sure matrices have compatible shapes",
          "Remember that matrix multiplication is not commutative"
        ])
      }
    ]);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seed().catch(console.error);
