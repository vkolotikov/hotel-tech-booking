<?php

return [
    'units' => [
        '2120861' => [
            'id'        => '2120861',
            'name'      => 'ForRest DeLuxe House',
            'slug'      => 'deluxe-house',
            'max_guests'=> 6,
            'bedrooms'  => 2,
            'thumbnail' => '/images/units/deluxe-house.jpg',
        ],
        '2120866' => [
            'id'        => '2120866',
            'name'      => 'ForRest Lodge',
            'slug'      => 'lodge',
            'max_guests'=> 4,
            'bedrooms'  => 1,
            'thumbnail' => '/images/units/lodge.jpg',
        ],
        '2295756' => [
            'id'        => '2295756',
            'name'      => 'ForRest No.5',
            'slug'      => 'no5',
            'max_guests'=> 4,
            'bedrooms'  => 1,
            'thumbnail' => '/images/units/no5.jpg',
        ],
        '2120871' => [
            'id'        => '2120871',
            'name'      => 'ForRest Sauna Lodge',
            'slug'      => 'sauna-lodge',
            'max_guests'=> 4,
            'bedrooms'  => 1,
            'thumbnail' => '/images/units/sauna-lodge.jpg',
        ],
        '2120856' => [
            'id'        => '2120856',
            'name'      => 'ForRest Tiny House',
            'slug'      => 'tiny-house',
            'max_guests'=> 2,
            'bedrooms'  => 1,
            'thumbnail' => '/images/units/tiny-house.jpg',
        ],
        '2120876' => [
            'id'        => '2120876',
            'name'      => 'Sauna House',
            'slug'      => 'sauna-house',
            'max_guests'=> 4,
            'bedrooms'  => 1,
            'thumbnail' => '/images/units/sauna-house.jpg',
        ],
    ],

    'extras' => [
        ['id' => 'sauna-1', 'name' => 'Private Sauna Ritual (1 person)', 'price' => 45.00, 'type' => 'per_stay'],
        ['id' => 'sauna-2', 'name' => 'Private Sauna Ritual (2 persons)', 'price' => 75.00, 'type' => 'per_stay'],
        ['id' => 'sauna-group', 'name' => 'Group Sauna (4-8 guests)', 'price' => 20.00, 'type' => 'per_guest'],
        ['id' => 'massage', 'name' => 'Massage', 'price' => 60.00, 'type' => 'per_stay'],
        ['id' => 'breakfast', 'name' => 'Breakfast Basket', 'price' => 18.00, 'type' => 'per_stay'],
        ['id' => 'roses', 'name' => 'Rose Bouquet', 'price' => 35.00, 'type' => 'per_stay'],
        ['id' => 'sweets', 'name' => 'Sweet Selection & Sparkling', 'price' => 42.00, 'type' => 'per_stay'],
        ['id' => 'cheese', 'name' => 'Cheese Board & Wine', 'price' => 48.00, 'type' => 'per_stay'],
        ['id' => 'jacuzzi', 'name' => 'Jacuzzi Access', 'price' => 55.00, 'type' => 'per_stay'],
    ],

    'policies' => [
        'check_in_time'  => '15:00',
        'check_out_time' => '11:00',
        'min_nights'     => 2,
        'currency'       => 'EUR',
        'tax_rate'       => 21.0,
    ],
];
