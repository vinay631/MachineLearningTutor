import { db } from "./index";
import { lessons, questions, codingExercises } from "./schema";

async function seed() {
  try {
    // Fundamentals Module
    const [introLesson] = await db.insert(lessons).values({
      title: "Introduction to Machine Learning",
      description: "Learn the fundamental concepts and terminology of Machine Learning, including supervised and unsupervised learning.",
      difficulty: 1,
      order: 1,
      module: "Fundamentals",
      type: "quiz"
    }).returning();

    const [pythonLesson] = await db.insert(lessons).values({
      title: "Python for ML",
      description: "Essential Python concepts for Machine Learning, including NumPy, Pandas, and basic data manipulation.",
      difficulty: 1,
      order: 2,
      module: "Fundamentals",
      type: "coding"
    }).returning();

    // Neural Networks Module
    const [nnLesson] = await db.insert(lessons).values({
      title: "Neural Networks Basics",
      description: "Understanding the fundamentals of Neural Networks, including neurons, layers, and activation functions.",
      difficulty: 2,
      order: 1,
      module: "Neural Networks",
      type: "quiz"
    }).returning();

    const [nnCodingLesson] = await db.insert(lessons).values({
      title: "Building a Simple Neural Network",
      description: "Implement a basic neural network from scratch using NumPy.",
      difficulty: 2,
      order: 2,
      module: "Neural Networks",
      type: "coding"
    }).returning();

    // Deep Learning Module
    const [cnnLesson] = await db.insert(lessons).values({
      title: "Convolutional Neural Networks",
      description: "Learn about CNNs and their applications in computer vision.",
      difficulty: 3,
      order: 1,
      module: "Deep Learning",
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
        question: "Which of these is NOT a type of Machine Learning?",
        options: JSON.stringify([
          "Supervised Learning",
          "Unsupervised Learning",
          "Manual Learning",
          "Reinforcement Learning"
        ]),
        correctAnswer: "Manual Learning",
        explanation: "The main types of Machine Learning are Supervised Learning, Unsupervised Learning, and Reinforcement Learning."
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
      },
      {
        lessonId: cnnLesson.id,
        question: "What is the main purpose of Convolutional Neural Networks?",
        options: JSON.stringify([
          "Natural Language Processing",
          "Image Processing and Computer Vision",
          "Audio Processing",
          "Time Series Analysis"
        ]),
        correctAnswer: "Image Processing and Computer Vision",
        explanation: "CNNs are specifically designed to process grid-like data such as images, making them ideal for computer vision tasks."
      }
    ]);

    // Insert Coding Exercises
    await db.insert(codingExercises).values([
      {
        lessonId: pythonLesson.id,
        title: "NumPy Arrays",
        description: "Create and manipulate NumPy arrays for ML applications",
        initialCode: `import numpy as np

# Create a 2x3 array with random numbers between 0 and 1
def create_array():
    # Your code here
    pass

# Calculate the mean of each column
def column_means(array):
    # Your code here
    pass`,
        solution: `import numpy as np

def create_array():
    return np.random.rand(2, 3)

def column_means(array):
    return np.mean(array, axis=0)`,
        testCases: JSON.stringify([
          {
            test: "arr = create_array()\ntype(arr).__module__ == 'numpy' and arr.shape == (2, 3)",
            message: "Array should be a 2x3 NumPy array"
          },
          {
            test: "arr = np.array([[1, 2, 3], [4, 5, 6]])\nnp.array_equal(column_means(arr), np.array([2.5, 3.5, 4.5]))",
            message: "Column means should be calculated correctly"
          }
        ]),
        hints: JSON.stringify([
          "Use np.random.rand() to create random numbers",
          "The array should have shape (2, 3)",
          "Use np.mean() with axis parameter for column means"
        ])
      },
      {
        lessonId: nnCodingLesson.id,
        title: "Implementing a Neural Network",
        description: "Create a simple neural network with forward propagation",
        initialCode: `import numpy as np

class SimpleNeuralNetwork:
    def __init__(self, input_size, hidden_size, output_size):
        # Initialize weights and biases
        self.w1 = np.random.randn(input_size, hidden_size)
        self.b1 = np.zeros(hidden_size)
        self.w2 = np.random.randn(hidden_size, output_size)
        self.b2 = np.zeros(output_size)

    def sigmoid(self, x):
        # Implement sigmoid activation function
        pass

    def forward(self, x):
        # Implement forward propagation
        pass`,
        solution: `import numpy as np

class SimpleNeuralNetwork:
    def __init__(self, input_size, hidden_size, output_size):
        self.w1 = np.random.randn(input_size, hidden_size)
        self.b1 = np.zeros(hidden_size)
        self.w2 = np.random.randn(hidden_size, output_size)
        self.b2 = np.zeros(output_size)

    def sigmoid(self, x):
        return 1 / (1 + np.exp(-x))

    def forward(self, x):
        h = self.sigmoid(np.dot(x, self.w1) + self.b1)
        y = self.sigmoid(np.dot(h, self.w2) + self.b2)
        return y`,
        testCases: JSON.stringify([
          {
            test: `nn = SimpleNeuralNetwork(2, 3, 1)
x = np.array([[0, 0], [0, 1], [1, 0], [1, 1]])
y = nn.forward(x)
y.shape == (4, 1) and np.all((y >= 0) & (y <= 1))`,
            message: "Neural network should process input correctly and output values between 0 and 1"
          }
        ]),
        hints: JSON.stringify([
          "The sigmoid function is 1/(1 + e^(-x))",
          "Use np.dot for matrix multiplication",
          "Remember to add the bias terms after matrix multiplication"
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