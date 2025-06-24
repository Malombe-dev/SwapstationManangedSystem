
// frontend/src/utils/validation.js
export const validatePhoneNumber = (phone) => {
    const kenyanPhoneRegex = /^(\+254|254|0)?[17]\d{8}$/;
    return kenyanPhoneRegex.test(phone);
  };
  
  export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  export const validateNationalId = (id) => {
    return id && id.length >= 7 && id.length <= 8 && /^\d+$/.test(id);
  };
  
  export const validatePlateNumber = (plate) => {
    const kenyanPlateRegex = /^K[A-Z]{2}\s?\d{3}[A-Z]$/;
    return kenyanPlateRegex.test(plate.toUpperCase());
  };
  
  export const validateRiderForm = (formData) => {
    const errors = {};
    
    if (!formData.personalInfo?.fullName?.trim()) {
      errors.fullName = 'Full name is required';
    }
    
    if (!validatePhoneNumber(formData.personalInfo?.phoneNumber)) {
      errors.phoneNumber = 'Valid Kenyan phone number is required';
    }
    
    if (formData.personalInfo?.email && !validateEmail(formData.personalInfo.email)) {
      errors.email = 'Valid email address is required';
    }
    
    if (!validateNationalId(formData.personalInfo?.nationalId)) {
      errors.nationalId = 'Valid national ID is required';
    }
    
    if (!validatePlateNumber(formData.bikeInfo?.plateNumber)) {
      errors.plateNumber = 'Valid Kenyan plate number is required (e.g., KBA 123A)';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };