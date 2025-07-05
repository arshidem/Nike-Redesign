const Joi = require('joi');

exports.validateCouponInput = (data, isUpdate = false) => {
  const schema = Joi.object({
    code: isUpdate ? 
      Joi.string().uppercase().trim().min(5).max(20).regex(/^[A-Z0-9]+$/) : 
      Joi.string().uppercase().trim().min(5).max(20).regex(/^[A-Z0-9]+$/).required(),
    name: Joi.string().max(50).required(),
    description: Joi.string().max(200),
    discountType: Joi.string().valid('percentage', 'fixed', 'free_shipping').required(),
    discountValue: Joi.when('discountType', {
      is: Joi.not('free_shipping'),
      then: Joi.number().min(0).required(),
      otherwise: Joi.number().min(0)
    }),
    minOrderAmount: Joi.number().min(0),
    maxDiscount: Joi.number().min(0),
    startDate: Joi.date(),
    endDate: Joi.date().greater(Joi.ref('startDate')).required(),
    maxUses: Joi.number().min(1),
    isActive: Joi.boolean(),
    applicableCategories: Joi.array().items(Joi.string().hex().length(24)),
    excludedProducts: Joi.array().items(Joi.string().hex().length(24)),
    userSpecific: Joi.boolean(),
    eligibleUsers: Joi.when('userSpecific', {
      is: true,
      then: Joi.array().items(Joi.string().hex().length(24)).min(1),
      otherwise: Joi.array().items(Joi.string().hex().length(24))
    }),
    singleUse: Joi.boolean()
  });

  return schema.validate(data);
};