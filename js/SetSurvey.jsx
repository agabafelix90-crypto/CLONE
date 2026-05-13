import React, { useState } from 'react';
import './SetSurvey.css';

function SetSurvey() {
  const [formData, setFormData] = useState({
    ageRange: '',
    gender: '',
    location: '',
    serviceInterest: [],
    freeServices: [],  // State for free services
    currentSatisfaction: '',
    serviceLacking: '',
    improvements: '',
    switchLikelihood: '',
    appointmentPreference: '',
    communicationPreference: '',
    receiveUpdates: '',
    receiveOffers: '',
    additionalComments: '',
    telemedicine: '',
    promotionService: '',
    promotionServiceOther: '',
    phoneNumber: '',
    followUpPhoneNumber: '',  // State for phone number to follow-up
    
    // New fields
    clinicChoiceReasons: [],  // Reasons for choosing a clinic over another
    preferredLocation: '',  // Preference for town or village
    preferredStaffAge: '',  // Preference for staff age
    additionalCommentsOnChoice: ''  // Additional comments about clinic choice
  });
  
  

  // Restrict free services selection to 2
  const handleFreeServicesChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prevState) => {
      if (checked && prevState.freeServices.length >= 2) {
        // If more than 2 are selected, do not allow more
        return prevState;
      }
      if (checked) {
        return {
          ...prevState,
          freeServices: [...prevState.freeServices, value],
        };
      } else {
        return {
          ...prevState,
          freeServices: prevState.freeServices.filter((item) => item !== value),
        };
      }
    });
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'clinicChoiceReasons') {
      setFormData((prevState) => ({
        ...prevState,
        clinicChoiceReasons: checked
          ? [...prevState.clinicChoiceReasons, value]
          : prevState.clinicChoiceReasons.filter((item) => item !== value),
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };
  

  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Survey submitted:', formData);
  };


  return (
    <div className="survey-container">
      <h1>Welcome to Forever Nursing Home Buloba Kiwumu</h1>
      <p>
        We are located opposite Onwards Secondary School. We are dedicated to providing high-quality care, and your feedback is crucial in helping us meet your needs. Please take a few moments to complete this survey to help us improve our services and tailor them to better serve you.
      </p>
      
      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <fieldset>
          <legend>Basic Information</legend>
          <label>
            Age Range:
            <select
              name="ageRange"
              value={formData.ageRange}
              onChange={handleChange}
              required
            >
              <option value="">Select Age Range</option>
              <option value="under18">Under 18</option>
              <option value="18-24">18-24</option>
              <option value="25-34">25-34</option>
              <option value="35-44">35-44</option>
              <option value="45-54">45-54</option>
              <option value="55-64">55-64</option>
              <option value="65+">65 and over</option>
            </select>
          </label>
          <br />
          <label>
            Gender:
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </label>
          <br />
          <label>
            Location :
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </label>
        </fieldset>

        

        {/* Health and Wellness Needs */}
        <fieldset>
          <legend>Health and Wellness Needs</legend>
          <label>
            Which of the following health services are you most interested in? (Select all that apply)
            <br />
            <input
              type="checkbox"
              name="serviceInterest"
              value="general-checkups"
              checked={formData.serviceInterest.includes('general-checkups')}
              onChange={handleChange}
            />
            General Check-ups
            <br />
            <input
              type="checkbox"
              name="serviceInterest"
              value="specialist-consultations"
              checked={formData.serviceInterest.includes('specialist-consultations')}
              onChange={handleChange}
            />
            
            Specialist Consultations
            <br />
            <input
              type="checkbox"
              name="serviceInterest"
              value="preventive-care"
              checked={formData.serviceInterest.includes('preventive-care')}
              onChange={handleChange}
            />
            Preventive Care
            <br />
            <input
              type="checkbox"
              name="serviceInterest"
              value="chronic-disease-management"
              checked={formData.serviceInterest.includes('chronic-disease-management')}
              onChange={handleChange}
            />
            Chronic Disease Management
            <br />
            <input
              type="checkbox"
              name="serviceInterest"
              value="emergency-care"
              checked={formData.serviceInterest.includes('emergency-care')}
              onChange={handleChange}
            />
            Emergency Care
            <br />
            <input
              type="checkbox"
              name="serviceInterest"
              value="mental-health-services"
              checked={formData.serviceInterest.includes('mental-health-services')}
              onChange={handleChange}
            />
            Mental Health Services
            <br />
            <input
              type="checkbox"
              name="serviceInterest"
              value="dental-care"
              checked={formData.serviceInterest.includes('dental-care')}
              onChange={handleChange}
            />
            Dental Care
            <br />
            <input
              type="checkbox"
              name="serviceInterest"
              value="other"
              checked={formData.serviceInterest.includes('other')}
              onChange={handleChange}
            />
            Other (please specify):
            <input
              type="text"
              name="serviceInterestOther"
              value={formData.serviceInterest.includes('other') ? formData.serviceInterest.find(item => item === 'other') : ''}
              onChange={handleChange}
            />
          </label>
        </fieldset>

        {/* Existing Healthcare Experience */}
        <fieldset>
          <legend>Existing Healthcare Experience</legend>
          <label>
            How satisfied are you with your current healthcare provider(s)?
            <select
              name="currentSatisfaction"
              value={formData.currentSatisfaction}
              onChange={handleChange}
              required
            >
              <option value="">Select Satisfaction Level</option>
              <option value="very-satisfied">Very Satisfied</option>
              <option value="satisfied">Satisfied</option>
              <option value="neutral">Neutral</option>
              <option value="dissatisfied">Dissatisfied</option>
              <option value="very-dissatisfied">Very Dissatisfied</option>
            </select>
          </label>
          <br />
          <label>
            What do you like most about your current  healthcare provider(s) or clinics?
            <textarea
              name="likesMost"
              value={formData.likesMost}
              onChange={handleChange}
            />
          </label>
          <br />
          <label>
            What do you dislike or find challenging about your current healthcare provider(s) or clinics?
            <textarea
              name="dislikes"
              value={formData.dislikes}
              onChange={handleChange}
            />
          </label>
        </fieldset>

        {/* Gaps and Opportunities */}
        <fieldset>
          <legend>Gaps and Opportunities</legend>
          <label>
            Are there any healthcare services or specialties that you feel are lacking in your area?
            <textarea
              name="serviceLacking"
              value={formData.serviceLacking}
              onChange={handleChange}
            />
          </label>
          <br />
          <label>
            What improvements would you like to see in your local healthcare services?
            <textarea
              name="improvements"
              value={formData.improvements}
              onChange={handleChange}
            />
          </label>
          <br />
          <label>
            How likely are you to switch to a new healthcare provider if they offered better services?
            <select
              name="switchLikelihood"
              value={formData.switchLikelihood}
              onChange={handleChange}
              required
            >
              <option value="">Select Likelihood</option>
              <option value="very-likely">Very Likely</option>
              <option value="likely">Likely</option>
              <option value="neutral">Neutral</option>
              <option value="unlikely">Unlikely</option>
              <option value="very-unlikely">Very Unlikely</option>
            </select>
          </label>
        </fieldset>

        {/* Appointment Preferences */}
        <fieldset>
          <legend>Appointment Preferences</legend>
          <label>
            Do you prefer appointments to be scheduled via phone call or text message?
            <select
              name="appointmentPreference"
              value={formData.appointmentPreference}
              onChange={handleChange}
              required
            >
              <option value="">Select Preference</option>
              <option value="phone-call">Phone Call</option>
              <option value="text-message">Text Message</option>
              <option value="either">Either</option>
            </select>
          </label>
          <br />
          <label>
            How would you prefer to receive updates and reminders about your appointments?
            <select
              name="communicationPreference"
              value={formData.communicationPreference}
              onChange={handleChange}
              required
            >
              <option value="">Select Preference</option>
              <option value="phone-call">Phone Call</option>
              <option value="text-message">Text Message</option>
              <option value="email">Email</option>
            </select>
          </label>
          <br />
          <label>
            Would you like to receive updates about new services, promotions, and events from our facility?
            <select
              name="receiveUpdates"
              value={formData.receiveUpdates}
              onChange={handleChange}
              required
            >
              <option value="">Select Preference</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <br />
          <label>
            Are you interested in receiving offers and promotions from our facility?
            <select
              name="receiveOffers"
              value={formData.receiveOffers}
              onChange={handleChange}
              required
            >
              <option value="">Select Preference</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        </fieldset>

       

        {/* Telemedicine and Promotion */}
        <fieldset>
          <legend>Telemedicine and Promotions</legend>
          <label>
            Are you interested in telemedicine services? (things like online video chat with our doctors and receiving prescriptions online, through your whatsapp or any other platform)
            <select
              name="telemedicine"
              value={formData.telemedicine}
              onChange={handleChange}
              required
            >
              <option value="">Select Option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="unsure">Unsure</option>
            </select>
          </label>
          <br />
          <label>
            Are you interested in receiving promotions for our services?
            <select
              name="promotionService"
              value={formData.promotionService}
              onChange={handleChange}
              required
            >
              <option value="">Select Option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="maybe">Maybe</option>
            </select>
          </label>
          <br />
          <label>
            If you selected "Yes" or "Maybe" above, please specify which services you are interested in:
            <input
              type="text"
              name="promotionServiceOther"
              value={formData.promotionServiceOther}
              onChange={handleChange}
            />
          </label>
        </fieldset>
        <fieldset>
          <legend>Free Services</legend>
          <label>
            Which of the following promotional services are you interested in?(As an appreciation for filling in our survey, we shall offer them to you for free) (Select up to 3)
            <br />
            <input
              type="checkbox"
              name="freeServices"
              value="hiv-test"
              checked={formData.freeServices.includes('hiv-test')}
              onChange={handleFreeServicesChange}
              disabled={formData.freeServices.length >= 2 && !formData.freeServices.includes('hiv-test')} // Disable if 2 already selected
            />
            HIV Test
            <br />
            <input
              type="checkbox"
              name="freeServices"
              value="blood-grouping"
              checked={formData.freeServices.includes('blood-grouping')}
              onChange={handleFreeServicesChange}
              disabled={formData.freeServices.length >= 2 && !formData.freeServices.includes('blood-grouping')}
            />
            Blood Grouping
            <br />
            <input
              type="checkbox"
              name="freeServices"
              value="ultrasound-scan"
              checked={formData.freeServices.includes('ultrasound-scan')}
              onChange={handleFreeServicesChange}
              disabled={formData.freeServices.length >= 2 && !formData.freeServices.includes('ultrasound-scan')}
            />
            Ultrasound Scan
          </label>
          <br />
          <label>
            Phone Number (for appointment scheduling):
            <input
              type="tel"
              name="followUpPhoneNumber"
              value={formData.followUpPhoneNumber}
              onChange={handleChange}
              placeholder="Your phone number"
              required
            />
          </label>
        </fieldset>
      
        <fieldset>
  <legend>Clinic Choice Preferences</legend>

  <label>
    What are the top 4 reasons you would choose a clinic over another? (Select up to 4)
    <br />
    <input
      type="checkbox"
      name="clinicChoiceReasons"
      value="location-ease-of-access"
      checked={formData.clinicChoiceReasons.includes('location-ease-of-access')}
      onChange={handleChange}
    />
    Location (Ease of Access)
    <br />
    <input
      type="checkbox"
      name="clinicChoiceReasons"
      value="friendly-caring-staff"
      checked={formData.clinicChoiceReasons.includes('friendly-caring-staff')}
      onChange={handleChange}
    />
    Very Friendly and Caring Staff
    <br />
    <input
      type="checkbox"
      name="clinicChoiceReasons"
      value="good-treatment-results"
      checked={formData.clinicChoiceReasons.includes('good-treatment-results')}
      onChange={handleChange}
    />
    Good Results from Treatment
    <br />
    <input
      type="checkbox"
      name="clinicChoiceReasons"
      value="hygiene"
      checked={formData.clinicChoiceReasons.includes('hygiene')}
      onChange={handleChange}
    />
    Good Hygiene of Both Staff and Clinic
    <br />
    <input
      type="checkbox"
      name="clinicChoiceReasons"
      value="modern-medical-machinery"
      checked={formData.clinicChoiceReasons.includes('modern-medical-machinery')}
      onChange={handleChange}
    />
    Presence of Quality and Modern Medical Machinery
    <br />
    <input
      type="checkbox"
      name="clinicChoiceReasons"
      value="other"
      checked={formData.clinicChoiceReasons.includes('other')}
      onChange={handleChange}
    />
    Other (please specify):
    <input
      type="text"
      name="clinicChoiceReasonsOther"
      value={formData.clinicChoiceReasons.includes('other') ? formData.clinicChoiceReasons.find(item => item === 'other') : ''}
      onChange={handleChange}
    />
  </label>
  <br />

  <label>
    Do you prefer clinics located in towns or villages?
    <select
      name="preferredLocation"
      value={formData.preferredLocation}
      onChange={handleChange}
      required
    >
      <option value="">Select Preference</option>
      <option value="towns">Towns</option>
      <option value="villages">Villages</option>
    </select>
  </label>
  <br />

  <label>
    Do you have a preference for the age of the staff?
    <select
      name="preferredStaffAge"
      value={formData.preferredStaffAge}
      onChange={handleChange}
      required
    >
      <option value="">Select Preference</option>
      <option value="older-staff">Older Staff (e.g., 40+)</option>
      <option value="younger-staff">Younger Staff (e.g., 20s)</option>
      <option value="no-preference">No Preference</option>
    </select>
  </label>
  <br />

  <label>
    Any additional comments about why you choose a clinic?
    <textarea
      name="additionalCommentsOnChoice"
      value={formData.additionalCommentsOnChoice}
      onChange={handleChange}
    />
  </label>
</fieldset>


         {/* Additional Comments */}
        <fieldset>
          <legend>Additional Comments</legend>
          <label>
            Do you have any additional comments or suggestions for us? Help us improve our services
            <textarea
              name="additionalComments"
              value={formData.additionalComments}
              onChange={handleChange}
            />
          </label>
        </fieldset>

        {/* Submit Button */}
        <button type="submit">Submit Survey</button>
      </form>
    </div>
  );
}

export default SetSurvey;
