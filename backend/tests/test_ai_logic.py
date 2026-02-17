import pytest
import unittest.mock
from io import BytesIO


def test_generate_recommendations(client_user, db_session, mock_gemini):
    """Test the generate_recommendations endpoint with mocked Gemini API"""
    # Mock file operations to avoid actual file I/O (patch where the route imported them)
    with unittest.mock.patch('app.routes.recommendations.save_word_file', return_value='fake_path.docx'), \
         unittest.mock.patch('app.routes.recommendations.parse_word_file', return_value='Mock document text with recommendations'), \
         unittest.mock.patch('app.routes.recommendations.delete_word_file', return_value=True):

        # Create a fake file upload
        fake_file = BytesIO(b"fake docx content")
        fake_file.name = "test.docx"
        
        # Make the request
        response = client_user.post(
            "/api/v1/recommendations/upload?visit_date=2024-01-01",
            files={"file": ("test.docx", fake_file, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        )
        
        assert response.status_code == 200
        result = response.json()
        
        # Verify the response structure
        assert "recommendations" in result
        assert len(result["recommendations"]) == 2
        assert result["recommendations"][0]["text"] == "Drink more water"
        assert result["recommendations"][1]["text"] == "Eat more vegetables"
        
        # Verify that the mock was called
        # The mock_gemini is the patched GenerativeModel
        # Since we patched it at the class level, we need to check if generate_content was called
        # But since it's a context manager, we can assert it was called during the request
        
        # Check that recommendations were saved to DB
        from app.models.nutritionist_recommendations import NutritionistRecommendations
        saved_recs = db_session.query(NutritionistRecommendations).filter_by(user_id=1).all()
        assert len(saved_recs) == 1
        recs_json = saved_recs[0].recommendations
        assert isinstance(recs_json, list)
        assert recs_json[0]["text"] == "Drink more water"
        assert recs_json[1]["text"] == "Eat more vegetables"