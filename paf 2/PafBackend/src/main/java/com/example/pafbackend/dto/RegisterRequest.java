package com.example.pafbackend.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
} 