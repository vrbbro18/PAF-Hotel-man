package com.example.pafbackend.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "mealPlans")
public class MealPlan {
    @Id
    private String id;
    private String userId;
    private String name;
    private String description;
    private String[] meals;
    private String[] ingredients;
    private String[] instructions;
}
