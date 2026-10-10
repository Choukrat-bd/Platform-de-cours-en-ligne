const courseModel = require('../models/course.model');
const userModel = require('../models/user.model');
const enrollmentModel = require('../models/enrollment.model');
const certificateModel = require('../models/certificate.model');

/** GET /api/stats  (enseignant / admin) - statistiques globales de la plateforme */
exports.global = async (req, res) => {
  const [courses] = await courseModel.count();
  const [students] = await userModel.countStudents();
  const [enrollments] = await enrollmentModel.countEnrollments();
  const [certificates] = await certificateModel.count();

  return res.json({
    stats: {
      courses: Number(courses.total || 0),
      students: Number(students.total || 0),
      enrollments: Number(enrollments.total || 0),
      certificates: Number(certificates.total || 0)
    }
  });
};